.. blog:authors:: mmastrac msullivan
.. blog:published-on:: 2025-01-22 10:00 AM PT
.. blog:lead-image:: images/splash.jpg
.. blog:guid:: 79881614-d8e1-11ef-9de7-62d525b6db0b
.. blog:description::
    Threads, TLS, a C stdlib race, and Rust: how EdgeDB hit a hidden landmine.


===========================================================
C stdlib isn't threadsafe and even safe Rust didn't save us
===========================================================

.. note::

  Check out the discussion of this post on
  `Hacker News <https://news.ycombinator.com/item?id=42796058>`_.

We're in the process of porting a significant portion of the network I/O code
in EdgeDB from Python to Rust, and we've been learning a lot of very
interesting lessons in the process.

The Crash That Only Happened on ARM64
-------------------------------------

We've been working on a new HTTP fetch feature for EdgeDB, using ``reqwest``
as our HTTP client library. Everything was going smoothly: the feature
worked locally, passed tests on x86_64 CI runners, and seemed stable.
But then we noticed something strange: the tests started failing
intermittently on our ARM64 CI runners.

At first glance, it looked like a deadlock. The test runner would start,
hang indefinitely, and then the CI job would time out. The logs showed no
errors—just a test spinning forever. And then, after a few hours, the job
would fail with a timeout error.

Here's what the CI output looked like:

.. code-block:: text

    Current runner version: '2.321.0'
    Runner name: '<instance-id>'
    Runner group name: 'Default'

    (... 6 hrs of logs ...)

    still running:
    test_immediate_connection_drop_streaming (pid=451) for 19874.78s

    still running:
    test_immediate_connection_drop_streaming (pid=451) for 19875.78s

    still running:
    test_immediate_connection_drop_streaming (pid=451) for 19876.78s

    still running:
    test_immediate_connection_drop_streaming (pid=451) for 19877.78s

    Shutting down test cluster...

Not much to go on here. It looked like a deadlock causing an async task to
improperly block to us at first. It turns out we were wrong.

Initial theories
----------------

Why just ARM64? This didn't make a lot of sense to us in the beginning.
Our first theories were in the difference of memory models between Intel and
ARM64. Intel has a fairly strict memory model---while some unusual behaviors
can happen, memory writes have a total order that all processors agree on
(`[1] <1_>`_, `[2] <2_>`_, `[3] <3_>`_).
ARM has a much more weakly-ordered memory model `[4] <4_>`_, where
(among other things) writes may appear in different orders to different
threads.

Since Sully's Ph.D. thesis was on this stuff `[5] <5_>`_,
this is when he got pulled in to take a look.

Debugging on the CI Machine
---------------------------

Our nightly CI machines run on Amazon AWS, which has the advantage of giving
us a real, uncontainerized root user. While you can connect github runners via
ssh `[6] <6_>`_, it's
nice to have the ability to connect as the true root user to get access to
dmesg and other system logs.

To figure out what was going on, we (Sully and Matt) decided to connect
directly to the ARM64 runner and see what was happening under the hood.

First, we SSH'd into the CI machine to try and find that hung process
to connect to it:

.. code-block:: shell-session

    $ aws ssm start-session --region us-west-2 --target i-<instance-id>
    $ ps aux | grep "451"
    <no output>

Oh, that's right! We run the build in a Docker container and it has its own
process namespace:

.. code-block:: shell-session

    $ sudo docker exec -it <container-id> /bin/sh
    # ps aux | grep "451"
    <no output>

Wait, hold on. The hung process isn't there either.

This wasn't a deadlock — the process had crashed.

It turns out our test runner failed to detect this—but that's fine, and a fix
for another day. We can see if the process left a coredump. Since a Docker
container is just a process namespace, the core dump gets passed to the Docker
host itself. We can try to find that from outside the container with
``journalctl``:

.. code-block:: shell-session

    $ sudo journalctl
    systemd-coredump: Process 59530 (python3) of user 1000 dumped core.
                      Stack trace of thread <tid>:
                      ...

Aha! We found it. And the core for that process lives in
``/var/lib/systemd/coredump/`` as expected. Note that we see a different pid
here because of process namespaces: the pid outside of the container (59530)
is different than the one inside (1000).

We loaded the core dump into ``gdb`` to see what happened. Unfortunately,
we were greeted with a number of errors:

.. code-block:: shell-session

    $ gdb
    (gdb) core-file core.python3.1000.<...>.59530.<...>
    warning: Can't open file /lib64/libnss_files-2.17.so during file-backed mapping note processing
    warning: Can't open file /lib64/librt-2.17.so during file-backed mapping note processing
    warning: Can't open file /lib64/libc-2.17.so during file-backed mapping note processing
    warning: Can't open file /lib64/libm-2.17.so during file-backed mapping note processing
    warning: Can't open file /lib64/libutil-2.17.so during file-backed mapping note processing
    ... etc ...
    (gdb) bt
    #0  0x0000ffff805a3e90 in ?? ()
    #1  0x0000ffff806a7000 in ?? ()
    Backtrace stopped: not enough registers or memory available to unwind further

Ack. That's not useful. We don't have the necessary files outside of the
container, and our containers are quite minimal and don't allow us to easily
install ``gdb``.

Instead, we need to copy the relevant libraries out of the container,
and tell ``gdb`` where the ``.so`` files live:

.. code-block:: shell-session

    # mkdir /container
    # docker cp <instance>:/lib /container
    # docker cp <instance>:/usr /container
    ... etc ...
    $ gdb
    (gdb) set solib-absolute-prefix /container
    (gdb) file /container/edgedb/bin/python3
    Reading symbols from /container/edgedb/bin/python3...
    (No debugging symbols found in /container/edgedb/bin/python3)
    (gdb) core-file core.python3.1000.<...>.59530.<...>
    (gdb) bt
    #0  0x0000ffff805a3e90 in getenv () from /container/lib64/libc.so.6
    #1  0x0000ffff8059c174 in __dcigettext () from /container/lib64/libc.so.6

Much better!

But rather than a crash in our new HTTP code, the backtrace revealed
something unexpected:

.. code-block:: shell-session

    (gdb) bt
    #0  0x0000ffff805a3e90 in getenv () from /container/lib64/libc.so.6
    #1  0x0000ffff8059c174 in __dcigettext () from /container/lib64/libc.so.6
    #2  0x0000ffff805f263c in strerror_r () from /container/lib64/libc.so.6
    #3  0x0000ffff805f254c in strerror () from /container/lib64/libc.so.6
    #4  0x00000000005bb76c in PyErr_SetFromErrnoWithFilenameObjects ()
    #5  0x00000000004e4c14 in ?? ()
    #6  0x000000000049f66c in PyObject_VectorcallMethod ()
    #7  0x00000000005d21e4 in ?? ()
    #8  0x00000000005d213c in ?? ()
    #9  0x00000000005d1ed4 in ?? ()
    #10 0x00000000004985ec in _PyObject_MakeTpCall ()
    #11 0x00000000004a7734 in _PyEval_EvalFrameDefault ()
    #12 0x000000000049ccb4 in _PyObject_FastCallDictTstate ()
    #13 0x00000000004ebce8 in ?? ()
    #14 0x00000000004985ec in _PyObject_MakeTpCall ()
    #15 0x00000000004a7734 in _PyEval_EvalFrameDefault ()
    #16 0x00000000005bee10 in ?? ()
    #17 0x0000ffff7ee1f5dc in ?? () from /container/.../_asyncio.cpython-312-aarch64-linux-gnu.so
    #18 0x0000ffff7ee1fd94 in ?? () from /container/.../_asyncio.cpython-312-aarch64-linux-gnu.so

We disassembled the crashing ``getenv`` function. Knowing that we build our
containers using GLIBC 2.17, we also located the relevant source for ``getenv``
to follow along `[7] <7_>`_:

.. code-block:: c
    :class: collapsible

    /* ... note: reformatted for brevity ... */
    char * getenv (const char *name) {
      size_t len = strlen (name);
      char **ep;
      uint16_t name_start;

      if (__environ == NULL || name[0] == '\0')
        return NULL;

      if (name[1] == '\0') {
        /* The name of the variable consists of only one character.  Therefore
           the first two characters of the environment entry are this character
           and a '=' character.  */
        name_start = ('=' << 8) | *(const unsigned char *) name;
        for (ep = __environ; *ep != NULL; ++ep) {
    	    uint16_t ep_start = (((unsigned char *) *ep)[0]
    			       | (((unsigned char *) *ep)[1] << 8));
      	  if (name_start == ep_start)
      	    return &(*ep)[2];
        }
      } else {
        name_start = (((const unsigned char *) name)[0]
          | (((const unsigned char *) name)[1] << 8));
        len -= 2;
        name += 2;

        for (ep = __environ; *ep != NULL; ++ep) {
      	  uint16_t ep_start = (((unsigned char *) *ep)[0]
      			       | (((unsigned char *) *ep)[1] << 8));
      	  if (name_start == ep_start && !strncmp (*ep + 2, name, len)
      	      && (*ep)[len + 2] == '=')
      	    return &(*ep)[len + 3];
      	}
      }

      return NULL;
    }

.. code-block:: assembly
   :class: collapsible

   (gdb) disassemble getenv
   Dump of assembler code for function getenv:
       0x0000ffff805a3de4 <+0>:     stp     x29, x30, [sp, #-64]!
       0x0000ffff805a3de8 <+4>:     mov     x29, sp
       0x0000ffff805a3dec <+8>:     stp     x19, x20, [sp, #16]
       0x0000ffff805a3df0 <+12>:    stp     x21, x22, [sp, #32]
       0x0000ffff805a3df4 <+16>:    stp     x23, x24, [sp, #48]
       0x0000ffff805a3df8 <+20>:    mov     x22, x0
       0x0000ffff805a3dfc <+24>:    bl      0xffff805f2784 <strlen>
       0x0000ffff805a3e00 <+28>:    mov     x24, x0
       0x0000ffff805a3e04 <+32>:    adrp    x0, 0xffff806eb000
       0x0000ffff805a3e08 <+36>:    ldr     x0, [x0, #3704]
       0x0000ffff805a3e0c <+40>:    ldr     x20, [x0]
       0x0000ffff805a3e10 <+44>:    cbz     x20, 0xffff805a3ed8 <getenv+244>
       0x0000ffff805a3e14 <+48>:    ldrb    w1, [x22]
       0x0000ffff805a3e18 <+52>:    cbz     w1, 0xffff805a3ed0 <getenv+236>
       0x0000ffff805a3e1c <+56>:    ldrb    w21, [x22, #1]
       0x0000ffff805a3e20 <+60>:    ldr     x19, [x20]
       0x0000ffff805a3e24 <+64>:    cbnz    w21, 0xffff805a3e70 <getenv+140>
       0x0000ffff805a3e28 <+68>:    mov     w21, #0x3d00                    // #15616
       0x0000ffff805a3e2c <+72>:    orr     w21, w1, w21
       0x0000ffff805a3e30 <+76>:    cbnz    x19, 0xffff805a3e40 <getenv+92>
       0x0000ffff805a3e34 <+80>:    b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3e38 <+84>:    ldr     x19, [x20, #8]!
       0x0000ffff805a3e3c <+88>:    cbz     x19, 0xffff805a3e58 <getenv+116>
       0x0000ffff805a3e40 <+92>:    ldrb    w1, [x19, #1]
       0x0000ffff805a3e44 <+96>:    ldrb    w0, [x19]
       0x0000ffff805a3e48 <+100>:   orr     w0, w0, w1, lsl #8
       0x0000ffff805a3e4c <+104>:   cmp     w21, w0
       0x0000ffff805a3e50 <+108>:   b.ne    0xffff805a3e38 <getenv+84>  // b.any
       0x0000ffff805a3e54 <+112>:   add     x19, x19, #0x2
       0x0000ffff805a3e58 <+116>:   mov     x0, x19
       0x0000ffff805a3e5c <+120>:   ldp     x21, x22, [sp, #32]
       0x0000ffff805a3e60 <+124>:   ldp     x19, x20, [sp, #16]
       0x0000ffff805a3e64 <+128>:   ldp     x23, x24, [sp, #48]
       0x0000ffff805a3e68 <+132>:   ldp     x29, x30, [sp], #64
       0x0000ffff805a3e6c <+136>:   ret
       0x0000ffff805a3e70 <+140>:   orr     w21, w1, w21, lsl #8
       0x0000ffff805a3e74 <+144>:   sxth    w21, w21
       0x0000ffff805a3e78 <+148>:   sub     x23, x24, #0x2
       0x0000ffff805a3e7c <+152>:   add     x22, x22, #0x2
       0x0000ffff805a3e80 <+156>:   cbnz    x19, 0xffff805a3e90 <getenv+172>
       0x0000ffff805a3e84 <+160>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3e88 <+164>:   ldr     x19, [x20, #8]!
       0x0000ffff805a3e8c <+168>:   cbz     x19, 0xffff805a3e58 <getenv+116>
    => 0x0000ffff805a3e90 <+172>:   ldrb    w4, [x19, #1]
       0x0000ffff805a3e94 <+176>:   ldrb    w3, [x19]
       0x0000ffff805a3e98 <+180>:   orr     w3, w3, w4, lsl #8
       0x0000ffff805a3e9c <+184>:   cmp     w21, w3, sxth
       0x0000ffff805a3ea0 <+188>:   b.ne    0xffff805a3e88 <getenv+164>  // b.any
       0x0000ffff805a3ea4 <+192>:   add     x0, x19, #0x2
       0x0000ffff805a3ea8 <+196>:   mov     x1, x22
       0x0000ffff805a3eac <+200>:   mov     x2, x23
       0x0000ffff805a3eb0 <+204>:   bl      0xffff805f2a44 <strncmp>
       0x0000ffff805a3eb4 <+208>:   cbnz    w0, 0xffff805a3e88 <getenv+164>
       0x0000ffff805a3eb8 <+212>:   ldrb    w0, [x19, x24]
       0x0000ffff805a3ebc <+216>:   cmp     w0, #0x3d
       0x0000ffff805a3ec0 <+220>:   b.ne    0xffff805a3e88 <getenv+164>  // b.any
       0x0000ffff805a3ec4 <+224>:   add     x24, x24, #0x1
       0x0000ffff805a3ec8 <+228>:   add     x19, x19, x24
       0x0000ffff805a3ecc <+232>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3ed0 <+236>:   mov     x19, #0x0                       // #0
       0x0000ffff805a3ed4 <+240>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3ed8 <+244>:   mov     x19, x20
       0x0000ffff805a3edc <+248>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3eb8 <+212>:   ldrb    w0, [x19, x24]
       0x0000ffff805a3ebc <+216>:   cmp     w0, #0x3d
       0x0000ffff805a3ec0 <+220>:   b.ne    0xffff805a3e88 <getenv+164>  // b.any
       0x0000ffff805a3ec4 <+224>:   add     x24, x24, #0x1
       0x0000ffff805a3ec8 <+228>:   add     x19, x19, x24
       0x0000ffff805a3ecc <+232>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3ed0 <+236>:   mov     x19, #0x0                       // #0
       0x0000ffff805a3ed4 <+240>:   b       0xffff805a3e58 <getenv+116>
       0x0000ffff805a3ed8 <+244>:   mov     x19, x20
       0x0000ffff805a3edc <+248>:   b       0xffff805a3e58 <getenv+116>
    End of assembler dump.

Huh, so it's crashing when loading a byte while scanning for the environment
variable of interest.

We can dump the current state of all the registers:

.. code-block:: shell-session

    (gdb) info reg
    ...
    x19            0x220               544
    x20            0x248b5000          613109760
    ...
    sp             0xffffddd93c80      0xffffddd93c80
    pc             0xffff805a3e90      0xffff805a3e90

So ``getenv`` was crashing trying to load from an invalid memory location
(``0x220`` -- a clearly invalid memory value). But how?

What Was Happening?
-------------------

At first, we were stumped. The crash was happening deep inside ``libc``.
We suspected something to do with environment variable corruption, given
the call to ``getenv``, but there wasn't enough information to go on.

We started inspecting the environment block using ``gdb``.

As a refresher, ``environ`` is defined as a ``char **`` by the POSIX
standard `[8] <8_>`_, and is effectively an list of pointers to environment
strings, with the end of the list marked as a ``NULL`` pointer.

.. code-block:: shell-session

    (gdb) x/s ((char**) environ)[0]
    0xffffddd95e6a: "GITHUB_STATE=/github/file_commands/save_state_0e5b7bd6-..."
    ...
    (gdb) x/s ((char**) environ)[66]
    0xffff6401f0b0: "SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt"
    (gdb) x/s ((char**) environ)[67]
    0xffff6401f8d0: "SSL_CERT_DIR=/etc/ssl/certs"
    (gdb) x/s ((char**) environ)[68]
    0x0:    <error: Cannot access memory at address 0x0>
    <etc>

But it didn't make sense—we were seeing a load from a space of memory that
should not be possible, and the environment here seems to be completely valid
and consistent. And exactly why were we calling ``getenv`` here?

And then Yury dropped in with a comment and link to an old blog post:

.. code-block:: irc

  <yury> Some file IO related operation seem to error out,
         and Python attempts to construct an exception from
         errno with PyErr_SetFromErrnoWithFilenameObjects

  <yury> which probably checks on gettext (translation hook?)
         which goes into getenv

  <yury> this could be why -- getenv isn't threadsafe
         https://rachelbythebay.com/w/2017/01/30/env/


The Real Culprit: setenv and getenv
-----------------------------------

``setenv`` is not a safe function to call in a multithreaded environment.
This is often a problem, and occasionally rediscovered as developers like us
hit weird crashes in libc's ``getenv`` `[9] <9_>`_, `[10] <10_>`_,
`[11] <11_>`_, `[12] <12_>`_.

This seemed like a possible cause, but given the lack of symbols here,
we couldn't understand how the threads that were running could contribute
to that crash.

Reading the disassembly, and cross-referencing it with the C code, we
determined that the register ``x20`` corresponded with the variable ``ep``,
the pointer used to walk through the ``environ`` array. But ``x20``
was ``0x248b5000``, and ``environ`` was ``0x28655750``, almost
60 megabytes later in memory.

Since ``x20`` is the pointer being used to read the old environment,
we could look at the surrounding memory to see if anything sensible
is still there, and could then compare that to the current ``environ``.

.. code-block:: shell-session

    (gdb) x/100g (char**)environ
    0x28655750:     0x0000ffffddd95e6a      0x0000ffffddd95ebd
    ...
    0x28655930:     0x0000ffffddd96f34      0x0000ffffddd96f6e
    0x28655940:     0x0000ffffddd96fa5      0x0000ffffddd96fc3
    0x28655950:     0x0000000024c1f710      0x0000000025213a70
    0x28655960:     0x0000ffff6401f0b0      0x0000ffff6401f8d0
    0x28655970:     0x0000000000000000      0x0000000000003401
    (gdb) x/20g $x20-40
    0x248b4fd8:     0x0000ffffddd96f6e      0x0000ffffddd96fa5
    0x248b4fe8:     0x0000ffffddd96fc3      0x0000000024c1f710
    0x248b4ff8:     0x0000000025213a70      0x0000000000000220
    0x248b5008:     0x0000000000000020      0x0000ffff7f5192a8
    0x248b5018:     0x0000000000000000      0x000000000a000150
    0x248b5028:     0x0000000000000031      0x0000ffff7f5192b8
    0x248b5038:     0x0000000000000000      0x000000000a0001c6
    0x248b5048:     0x000000000094af78      0x0000000000000030
    0x248b5058:     0x0000000000000041      0x0000000000000000
    0x248b5068:     0x0000000000000000      0x0000000000000000

Interesting! The pointer values in the two areas of memory are very similar!
And where do they start to differ? The final entries at ``0x0000ffff6401f0b0``
and ``0x0000ffff6401f8d0``: corresponding to ``SSL_CERT_FILE=...``
and  ``SSL_CERT_DIR=...``!

This was a clear hint that the race condition idea was right, and another
thread was moving ``environ`` as part of a call to ``setenv``! Looking at
``setenv``, it seemed that the space of memory holding the environment block
is too small, and it might have been reallocated to fit the new variables
`[13] <13_>`_.

That still left us with the question of how to find what code is calling
``setenv``. It seemed like it could be possible that OpenSSL and/or one of
``reqwest``'s other TLS-related dependencies (``rust-native-tls``) was
causing the crash, but how?

The Connection to ``openssl_probe``
-----------------------------------

A google search for those environment variables in concert with
``rust-native-tls`` pulled up an old issue: `[14] <14_>`_. And hidden in one of
the comments was this::

  Not sure about openssl. It looks like it currently
  loads the system certs by using openssl-probe to set
  the SSL_CERT_FILE and SSL_CERT_DIR environment variables,
  and then relies on SslConnector::builder to call
  ctx.set_default_verify_paths, which looks at those
  environment variables. Given that the environment variables
  are set globally once, it might be best to just try to clear
  the store afterwards. This seemed to work for me locally:

Interesting. So ``openssl-probe`` sets those variables. And sure enough,
we're using the ``rust-native-tls`` ``openssl`` backend on Linux which calls
into these functions!

Here's the unsafe-free, completely-innocent-looking offending lines from the
``openssl-probe`` library `[15] <15_>`_:

.. code-block:: rust

    pub fn try_init_ssl_cert_env_vars() -> bool {
        let ProbeResult { cert_file, cert_dir } = probe();
        // we won't be overwriting existing env variables
        // because if they're valid probe() will have
        // returned them unchanged
        if let Some(path) = &cert_file {
            env::set_var(ENV_CERT_FILE, path);
        }
        if let Some(path) = &cert_dir {
            env::set_var(ENV_CERT_DIR, path);
        }

        cert_file.is_some() || cert_dir.is_some()
     }

And that's how we ended up with a crash, caused by ``unsafe``-free Rust
code badly interacting with the use of ``libc`` elsewhere in the program.

An aside: what even is RISC?
----------------------------

While we both had experience with reverse engineering, our aarch64 assembly
skills were either rusty (Matt) or nonexistent (Sully), and so we spent
some time confused about one of the main loops in the assembly. The code
seemed to expect ``x20`` to be changing, and it was the clearest candidate
to be the register representing ``ep``, but it didn't appear on the left
hand side of any instruction.

Then we noticed a curious exclamation mark:

.. code-block:: assembly

   0x0000ffff805a3e88 <+164>:   ldr     x19, [x20, #8]!

It turns out this is the “pre-index” address mode, which behaves like
``x19 = *(x20 + 8); x20 = x20 + 8`` `[16] <16_>`_.

This is a cute little operator, but we are old enough to remember being told
that auto-increment address modes were a legacy of old-school CISC machines
like the VAX, eschewed even by more modern CISC machines like x86, and certainly
by the elegant and simple RISC designs. Everything old is new again, I suppose.

(Update: Well, not that new actually. ARM has had this since the
beginning; I think RISC lasted about a week.)

So why only ARM64 Linux?
------------------------

Because this crash is caused by a memory-moving ``realloc``, triggered by
``setenv`` which happens at the same time another thread is calling ``getenv``,
it requires a lot of pieces to fall into the right place. The number of
environment variables needs to be just right to cause a realloc.
An unrelated I/O failure picked up by ``asyncio`` needs to call ``getenv`` to
retrieve the ``LANGUAGE`` environment variable at exactly the same time.

The value ``0x220`` looks suspiciously close to the size of the old environment
in 64-bit words ``(0x220 / 8 = 68)``, and this value was written over the
terminating ``NULL`` of the environment block before it was moved, likely to
indicate the size of the free block to the system malloc but convenienty
providing an improper invalid pointer landmine for use-after-free victims
to hit.

Given all these preconditions, we were pretty lucky that it was even mostly
reproducible on a single platform.

The fix
--------

In the end, we decided that we're going to migrate away from ``reqwest``'s
``rust-native-tls``/``openssl`` backend to ``rustls`` on Linux. Our original
thinking behind using the native TLS backend was that we'd get to avoid
shipping two TLS engines as we continue to port Python code to Rust.
With this issue popping up, we decided that shipping two engines would be OK
in the short term.

Another option would have been to arrange to call ``try_init_ssl_cert_env_vars``
for the first time with Python's Global Interpreter Lock (the dreaded GIL) held.
Rust has an internal lock to prevent races between Rust code reading and writing
the environment at the same time, but it doesn't prevent code in other languages
from using ``libc`` directly. Holding the GIL would prevent us from racing with
our Python threads, at least.

The Rust project has already identified this as an issue, and has planned
on making the environment-setter functions unsafe in the 2024 edition
`[17] <17_>`_. The glibc project has also
(very) recently added more thread-safety to ``getenv``, by avoiding the
``realloc`` and leaking the older environments `[18] <18_>`_.

.. lint-off

.. _1: https://www.msully.net/blog/2015/02/25/the-x86-memory-model/
.. _2: https://research.swtch.com/hwmm
.. _3: https://www.cl.cam.ac.uk/~pes20/weakmemory/x86tso-paper.tphols.pdf
.. _4: https://dl.acm.org/doi/10.1145/1353522.1353528
.. _5: https://www.msully.net/thesis/
.. _6: https://github.com/marketplace/actions/ssh-to-github-action-runner
.. _7: https://elixir.bootlin.com/glibc/glibc-2.17.90/source/stdlib/getenv.c#L33
.. _8: https://www.man7.org/linux/man-pages/man7/environ.7.html
.. _9: https://www.evanjones.ca/setenv-is-not-thread-safe.html
.. _10: https://rachelbythebay.com/w/2017/01/30/env/
.. _11: https://github.com/golang/go/issues/63567
.. _12: https://blogs.gnome.org/mcatanzaro/2018/02/28/on-setenv-and-explosions/
.. _13: https://elixir.bootlin.com/glibc/glibc-2.17.90/source/stdlib/setenv.c#L33
.. _14: https://github.com/sfackler/rust-native-tls/issues/154
.. _15: https://github.com/alexcrichton/openssl-probe/blob/db67c9e5b333b1b4164467b17f5d99207fad004c/src/lib.rs#L65-L76
.. _16: https://developer.arm.com/documentation/102374/0102/Loads-and-stores---addressing
.. _17: https://github.com/rust-lang/rust/issues/124866
.. _18: https://github.com/bminor/glibc/commit/7a61e7f557a97ab597d6fca5e2d1f13f65685c61

.. lint-on

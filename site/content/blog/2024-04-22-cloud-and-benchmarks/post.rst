.. blog:authors:: elvis fantix
.. blog:published-on:: 2024-04-22 9:30 AM PT
.. blog:lead-image:: images/cloud.jpg
.. blog:guid:: 46f7c1f7-48df-4597-b506-f37151196a12
.. blog:recommendations:: why-orms-are-slow-and-getting-slower, edgedb-cloud-and-edgedb-4-0
.. blog:description::
   We're announcing the availability of EdgeDB
   Cloud Free Tier and reviewing cloud benchmarks.


========================================================================
EdgeDB Cloud Free Tier & how we stack up vs. PlanetScale, Supabase, Neon
========================================================================

.. raw:: html

    <p style="font-size:120%">
      We're thrilled to announce the general availability of the EdgeDB Cloud
      Free Tier. This marks a significant step forward in making EdgeDB
      more accessible and competitive. But what really sets EdgeDB
      Cloud apart? Let's dive into the details and a bit of benchmarking!
    </p>

.. image:: images/cloud.mp4
   :alt: EdgeDB Cloud Free Tier
   :align: center

What is EdgeDB Cloud?
=====================

Simply put, EdgeDB Cloud is a place where you host your EdgeDB
instances with minimum fuss.  EdgeDB Cloud (the service) and EdgeDB
(the software) have been co-developed closely to deliver great performance
and enhanced developer experience.

Here's what makes EdgeDB Cloud stand out:

**The CLI:** Install with a single *curl* command, or via
``npx edgedb``, and manage both EdgeDB Cloud and local EdgeDB instances
effortlessly.

**The Web UI:** The Cloud console lets you control all aspects
of your EdgeDB Cloud database: adding and editing data, visualizing schemas,
a command-line terminal, and much more.

.. blog:gallery::

    .. figure:: images/dashboard.jpg

        Cloud Dashboard

    .. figure:: images/editor.jpg

        Data Editor

    .. figure:: images/repl.jpg

        Web REPL

    .. figure:: images/schema.jpg

        Schema Browser


**Fully Integrated Auth:** We support multiple OAuth providers and
an email/password authentication flow, with many more features set to be
announced this week. This feature is tightly integrated with EdgeDB itself
and its `Access Policies <access_>`_ framework. Completely open-source and
free, and the number of active users it supports is *unlimited*.

**Simple and secure configuration:** Cloud instance access is authorized by
granular secret keys like any modern API should be. Arcane connection strings
with shared credentials are a thing of the past.

**Great performance:** we have benchmarks to show!

Cloud benchmarks
================

To mark the availability of EdgeDB Cloud Free Tier we extended our
`IMDBench <imdbench_>`_ database benchmark suite with the ability to run
against popular database cloud services. `Previously <prevbench_>`_ we used
simulated network latency to show the real-world impact of database interface
(in)efficiency, but today we are able to do this using real services.

As a reminder, `IMDBench <imdbench_>`_ models a basic IMDB-like website,
featuring endpoints for accessing detailed movie information,
actors, directors, reviews, and more. This setup provides a good framework
for meaningful performance evaluation using slightly non-trivial queries.

In this run we are comparing EdgeDB to Prisma and Drizzle --- two very
popular JavaScript ORM libraries running on popular cloud databases with
different levels of geographical proximity between the application and
the database.

.. edb:collapsed::
    :summary: Want to look at the kind of queries we're running?

    Consider this IMDBench query example: fetching data about a movie by its ID.
    This includes retrieving the movie's title, image, description,
    calculating its average rating, and fetching ordered lists of its
    directors, cast, and user reviews.

    Here are a few examples on what this might look like in EdgeQL, Prisma,
    and Drizzle. Notice how remarkably close EdgeQL's syntax is to its
    TypeScript query builder version.

    .. tabs::

        .. code-tab:: edgeql
            :caption: EdgeQL

            select Movie {
              id,
              image,
              title,
              year,
              description,
              avg_rating := math::mean(.reviews.score),

              directors: {
                id,
                full_name,
                image,
              }
              order by Movie.directors@list_order empty last
                then Movie.directors.last_name,

              cast: {
                id,
                full_name,
                image,
              }
              order by Movie.cast@list_order empty last
                then Movie.cast.last_name,

              reviews := (
                select Movie.<movie[is Review] {
                  id,
                  body,
                  rating,
                  author: {
                    id,
                    name,
                    image,
                  }
                }
                order by .creation_time desc
              ),
            }
            filter .id = <uuid>$id

        .. code-tab:: typescript
            :caption: EdgeQL in TypeScript

            e.params({id: e.uuid}, ($) =>
              e.select(e.Movie, (movie) => ({
                id: true,
                image: true,
                title: true,
                year: true,
                description: true,
                avg_rating: e.math.mean(movie.reviews.score),
                directors: {
                  id: true,
                  full_name: true,
                  image: true,
                  order_by: [
                    {
                      expression: movie.directors["@list_order"],
                      empty: e.EMPTY_LAST,
                    },
                    movie.directors.last_name,
                  ],
                },
                cast: {
                  id: true,
                  full_name: true,
                  image: true,
                  order_by: [
                    {
                      expression: movie.cast["@list_order"],
                      empty: e.EMPTY_LAST,
                    },
                    movie.cast.last_name,
                  ],
                },
                reviews: e.select(movie[".<movie[IS Review]"], (review) => ({
                  id: true,
                  body: true,
                  rating: true,
                  author: {
                    id: true,
                    name: true,
                    image: true,
                  },
                  order_by: {
                    expression: review.creation_time,
                    direction: e.DESC
                  }
                })),
                filter_single: {id: $.id}
              }))
            );

        .. code-tab:: typescript
            :caption: Prisma

            async movieDetails(id) {
              const result = await client.$transaction([
                client.movies.findUnique({
                  where: {
                    id: id,
                  },
                  select: {
                    id: true,
                    image: true,
                    title: true,
                    year: true,
                    description: true,

                    directors: {
                      select: {
                        person: {
                          select: {
                            id: true,
                            first_name: true,
                            middle_name: true,
                            last_name: true,
                            image: true,
                          },
                        },
                      },
                      orderBy: [
                        {
                          list_order: 'asc',
                        },
                        {
                          person: {
                            last_name: 'asc',
                          },
                        },
                      ],
                    },
                    cast: {
                      select: {
                        person: {
                          select: {
                            id: true,
                            first_name: true,
                            middle_name: true,
                            last_name: true,
                            image: true,
                          },
                        },
                      },
                      orderBy: [
                        {
                          list_order: 'asc',
                        },
                        {
                          person: {
                            last_name: 'asc',
                          },
                        },
                      ],
                    },

                    reviews: {
                      orderBy: {
                        creation_time: 'desc',
                      },
                      select: {
                        id: true,
                        body: true,
                        rating: true,
                        author: {
                          select: {
                            id: true,
                            name: true,
                            image: true,
                          },
                        },
                      },
                    },
                  },
                }),

                client.reviews.aggregate({
                  _avg: {
                    rating: true,
                  },
                  where: {
                    movie: {
                      id: id,
                    },
                  },
                }),
              ]);

              result[0].avg_rating = result[1]._avg.rating;
              // move the "person" object one level closer
              // to "directors" and "cast"
              for (let fname of ['directors', 'cast']) {
                result[0][fname] = result[0][fname].map((rel) => {
                  return {
                    id: rel.person.id,
                    full_name: `${rel.person.first_name} ${rel.person.last_name}`,
                    image: rel.person.image,
                  };
                });
              }

              return JSON.stringify(result[0]);
            }

        .. code-tab:: typescript
            :caption: Drizzle

            const preparedAvgRating = db
              .select({
                id: schema.reviews.movieId,
                avgRating: avg(schema.reviews.rating).mapWith(Number),
              })
              .from(schema.reviews)
              .groupBy(schema.reviews.movieId)
              .where(eq(schema.reviews.movieId, sql`any(${ids})`))
              .prepare("avgRating");

            const preparedMovieDetails = db.query.movies
              .findFirst({
                columns: {
                  id: true,
                  image: true,
                  title: true,
                  year: true,
                  description: true,
                },
                extras: {
                  avg_rating: sql`${sql.placeholder("avgRating")}`.as("avg_rating"),
                },
                with: {
                  directors: {
                    columns: {},
                    with: {
                      person: {
                        columns: {
                          id: true,
                          image: true,
                        },
                        extras: {
                          full_name: fullName.as("full_name"),
                        },
                      },
                    },
                    orderBy: [
                      // unsupported Drizzle features as of writing
                      asc(schema.directors.listOrder), // .nullsLast()
                      // asc(schema.persons.lastName),
                    ],
                  },
                  cast: {
                    columns: {},
                    with: {
                      person: {
                        columns: {
                          id: true,
                          image: true,
                        },
                        extras: {
                          full_name: fullName.as("full_name"),
                        },
                      },
                    },
                    orderBy: [
                      // unsupported Drizzle features as of writing
                      asc(schema.directors.listOrder), // .nullsLast()
                      // asc(schema.persons.lastName),
                    ],
                  },
                  reviews: {
                    columns: {
                      id: true,
                      body: true,
                      rating: true,
                    },
                    with: {
                      author: {
                        columns: {
                          id: true,
                          name: true,
                          image: true,
                        },
                      },
                    },
                    orderBy: [desc(schema.reviews.creationTime)],
                  },
                },
                where: eq(schema.movies.id, sql.placeholder("id")),
              })
              .prepare("movieDetails");


            async movieDetails(id: number): Promise<any> {
              // `extras` doesn't support aggregations yet
              const rs = await preparedAvgRating.execute({
                ids: `[${id}]`,
              });
              let avgRating: number = 0;
              if (rs.length > 0) {
                avgRating = rs[0].avgRating;
              }
              return await preparedMovieDetails.execute({ avgRating, id });
            }


The setup
---------

Here's what we're testing here:

* **EdgeDB Cloud:** Basic "Paid-tier" plan at $39/month, offering
  1 compute unit with 1/4 vCPU and 2 GiB RAM.

* **Supabase:** "Pro-tier" plan at $25/month plus "Small" add-on for $15/month,
  equaling to a shared 2-core ARM vCPU with 2GB RAM.

* **Neon:** "Launch" plan, with auto-suspend disabled and the autoscaler
  min/max set to 0.5 compute units. This plan includes 1/2 vCPU and 2GiB RAM.
  The total cost for this setup, boldly assuming the database is used
  every hour of the month, would be approximately $52/month
  (calculated as $19 + (24 hours * 30 days - 300 included hours) * $0.16 * 0.5
  for half a compute unit).

* **PlanetScale:** "PS-10" plan at $39/month, providing 1/8 vCPU and 1GiB RAM.
  Though PlanetScale runs MySQL, we decided to include it as a comparison point
  due to its popularity.

The client application is running on a ``c7a.xlarge`` AWS EC2 instance
(4vCPU, 8GiB RAM).

The database instance configurations are within the same price range and have
comparable compute resources.  Databases and clients were deployed to the same
cloud region (AWS ``us-east-1`` or ``us-east-2`` in most cases).

Results
-------

.. blog:chart:: BarBoxLatencyChart

    {
        "options": {
            "keyMetricField": "qps",
            "barYTitle": "Queries / sec",
            "boxYTitle": "Latency (msec)",
            "colors": ["#369c77"]
        },
        "data": [{"implementation": "edgedb", "duration": 11.41, "queries": 33296.46, "qps": 2918.04, "latency_min": 1.849, "latency_mean": 5.877, "latency_max": 586.513, "latency_std": 15.28, "latency_cv": 259.97, "latency_percentiles": [[25, 2.678], [50, 2.901], [75, 3.254], [90, 3.488], [99, 28.117], [99.99, 350.988]], "concurrency": 20}, {"implementation": "neon drizzle", "duration": 10.03, "queries": 10465.5, "qps": 1042.97, "latency_min": 6.767, "latency_mean": 19.091, "latency_max": 64.017, "latency_std": 5.934, "latency_cv": 31.08, "latency_percentiles": [[25, 14.644], [50, 18.428], [75, 22.365], [90, 26.643], [99, 36.157], [99.99, 63.514]], "concurrency": 20}, {"implementation": "supabase drizzle", "duration": 10.11, "queries": 4070.79, "qps": 402.82, "latency_min": 9.159, "latency_mean": 48.913, "latency_max": 171.306, "latency_std": 28.319, "latency_cv": 57.9, "latency_percentiles": [[25, 25.629], [50, 37.7], [75, 73.859], [90, 89.023], [99, 133.219], [99.99, 171.306]], "concurrency": 20}, {"implementation": "planetscale drizzle", "duration": 10.07, "queries": 6015.78, "qps": 597.41, "latency_min": 11.97, "latency_mean": 28.813, "latency_max": 112.142, "latency_std": 8.517, "latency_cv": 29.56, "latency_percentiles": [[25, 23.244], [50, 26.764], [75, 31.843], [90, 38.963], [99, 65.546], [99.99, 106.127]], "concurrency": 20}, {"implementation": "neon prisma", "duration": 10.05, "queries": 6443.18, "qps": 641.37, "latency_min": 13.081, "latency_mean": 30.973, "latency_max": 61.737, "latency_std": 5.604, "latency_cv": 18.09, "latency_percentiles": [[25, 26.571], [50, 30.043], [75, 34.654], [90, 38.225], [99, 46.615], [99.99, 61.742]], "concurrency": 20}, {"implementation": "supabase prisma", "duration": 10.04, "queries": 7643.35, "qps": 761.43, "latency_min": 15.249, "latency_mean": 26.152, "latency_max": 92.651, "latency_std": 4.892, "latency_cv": 18.7, "latency_percentiles": [[25, 23.627], [50, 24.802], [75, 26.595], [90, 29.582], [99, 48.213], [99.99, 92.653]], "concurrency": 20}, {"implementation": "planetscale prisma", "duration": 10.08, "queries": 3949.55, "qps": 391.76, "latency_min": 26.911, "latency_mean": 50.421, "latency_max": 93.0, "latency_std": 6.989, "latency_cv": 13.86, "latency_percentiles": [[25, 45.524], [50, 49.369], [75, 54.04], [90, 59.32], [99, 73.578], [99.99, 93.002]], "concurrency": 20}]
    }


Running atop PostgreSQL, EdgeDB handles a range of tasks—from
converting EdgeQL to SQL, managing the EdgeDB Auth API, and rendering its
user interface, to balancing client connections. We've invested significant
effort to fine-tune both EdgeDB and PostgreSQL to ensure optimal performance.
Pay specific attention to the latency chart: EdgeDB completed 99% queries
in 2.9ms, or **6x quicker** than than the nearest contender --- Drizzle
querying Neon.

This is the best case scenario where latency between the app and the database
is lowest one data center is lowest, typically under one millisecond.  The
results are even more dramatic if the app is further away from the database.
Below are full benchmark reports for some of those scenarios:

* :blog:local-file:`Same-region benchmarks <data/same-region.html>`
* :blog:local-file:`Near-region benchmarks <data/near-regions.html>`
* :blog:local-file:`Cross-coast benchmarks <data/east-west.html>`


What benchmarks don't reveal
----------------------------

Performance benchmarks are straightforward to interpret—they clearly show
what's faster and what's slower under specific tests or conditions. However,
what benchmarks often fail to convey is how *convenient* it is to use a tool,
or, in other words, whether the developer experience is satisfying.

While achieving high performance with raw SQL or ORMs is certainly possible,
it isn't effortless and inevitably complicates things --- leading to more
unreadable and unmaintainable code, as well as requiring various hacks.

At EdgeDB, our goal is not merely to create the fastest database at
the expense of usability. On the contrary, we designed EdgeDB from
the ground up with the principles of robustness, type-safety,
and composability in querying capabilities. The great performance
we observe is a direct consequence of these foundational choices.


The Future of EdgeDB Cloud
==========================

The launch of our free tier is more than just an offer --- it's a commitment
to providing developers with the best possible tools to create and scale
applications effortlessly.

We envision EdgeDB Cloud to be a powerful data layer that gives you
a state-of-the-art database experience along with application-level
services like integrated Auth, AI (more on this soon!), and storage.

Most importantly, we believe that EdgeDB Cloud has to integrate deeply with the
tools you use daily, like GitHub, Vercel, and many others, to ensure smooth
workflow. Stay tuned for more announcements this week as we have a lot of
new exciting things coming! ❤️

In the meantime, try it out by `creating your first EdgeDB Cloud instance now
<cloudgo_>`_!

.. _access: https://docs.edgedb.com/database/datamodel/access_policies
.. _imdbench: https://github.com/edgedb/imdbench/
.. _prevbench: https://www.edgedb.com/blog/why-orms-are-slow-and-getting-slower
.. _cloudgo: https://cloud.edgedb.com

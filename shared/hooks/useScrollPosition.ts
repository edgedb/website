import {useEffect} from "react";

export function useScrollPosition() {
  useEffect(() => {
    let updateQueued = false;

    const scrollHandler = () => {
      if (!updateQueued) {
        updateQueued = true;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty(
            "--pageScrollOffset",
            document.documentElement.scrollTop.toString()
          );
          document.documentElement.classList.add("pageScrollOffsetActive");
          updateQueued = false;
        });
      }
    };

    scrollHandler();

    document.addEventListener("scroll", scrollHandler, {passive: true});

    return () => {
      document.removeEventListener("scroll", scrollHandler);
      document.documentElement.style.setProperty("--pageScrollOffset", null);
      document.documentElement.classList.remove("pageScrollOffsetActive");
    };
  }, []);
}

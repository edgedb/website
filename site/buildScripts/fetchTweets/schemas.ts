import * as z from "zod";

export const collectionResponseSchema = z
  .object({
    response: z
      .object({
        timeline: z.array(
          z
            .object({
              tweet: z
                .object({
                  id: z.string(),
                })
                .nonstrict(),
            })
            .nonstrict()
        ),
        position: z
          .object({
            max_position: z.string(),
            min_position: z.string(),
            was_truncated: z.boolean(),
          })
          .nonstrict(),
      })
      .nonstrict(),
    objects: z
      .object({
        tweets: z.record(
          z
            .object({
              id_str: z.string(),
              text: z.string(),
              truncated: z.boolean(),
              user: z
                .object({
                  id_str: z.string(),
                })
                .nonstrict(),
              entities: z
                .object({
                  user_mentions: z.array(
                    z
                      .object({
                        screen_name: z.string(),
                        indices: z.tuple([z.number(), z.number()]),
                      })
                      .nonstrict()
                  ),
                  urls: z.array(
                    z
                      .object({
                        display_url: z.string(),
                        expanded_url: z.string(),
                        indices: z.tuple([z.number(), z.number()]),
                      })
                      .nonstrict()
                  ),
                  hashtags: z.array(
                    z
                      .object({
                        text: z.string(),
                        indices: z.tuple([z.number(), z.number()]),
                      })
                      .nonstrict()
                  ),
                })
                .nonstrict(),
            })
            .nonstrict()
        ),
        users: z.record(
          z
            .object({
              id_str: z.string(),
              name: z.string(),
              screen_name: z.string(),
              profile_image_url_https: z.string(),
            })
            .nonstrict()
        ),
      })
      .nonstrict(),
  })
  .nonstrict();

export const v2TweetsResponseSchema = z
  .object({
    data: z.array(
      z
        .object({
          id: z.string(),
          text: z.string(),
          entities: z
            .object({
              mentions: z.array(
                z
                  .object({
                    username: z.string(),
                    start: z.number(),
                    end: z.number(),
                  })
                  .nonstrict()
              ),
              hashtags: z.array(
                z
                  .object({
                    tag: z.string(),
                    start: z.number(),
                    end: z.number(),
                  })
                  .nonstrict()
              ),
              urls: z.array(
                z
                  .object({
                    display_url: z.string(),
                    expanded_url: z.string(),
                    start: z.number(),
                    end: z.number(),
                  })
                  .nonstrict()
              ),
            })
            .partial()
            .nonstrict(),
        })
        .nonstrict()
    ),
  })
  .nonstrict();

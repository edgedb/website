import type {NextApiRequest, NextApiResponse} from "next";

import mailchimpClient from "@mailchimp/mailchimp_marketing";

import {mailchimpServer, mailchimpListId, mailchimpTags} from "../../config";

import type {SubscribeResponse} from "@edgedb-site/shared/components/subscribe";

mailchimpClient.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: mailchimpServer,
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const email = req.body.email;
  const tag = req.body.tag;

  if (!email) {
    res.status(400).send("No email in request");
    return;
  }

  const tagId = mailchimpTags[tag];

  try {
    await mailchimpClient.lists.addListMember(mailchimpListId, {
      email_address: email,
      status: "pending",
      tags: tagId ? [tagId] : undefined,
    });
    res.status(200);
    res.json({
      result: "success",
    } satisfies SubscribeResponse);
  } catch (err: any) {
    if (err.response) {
      const body = err.response.body;
      res.status(200);
      if (body?.title?.toLowerCase().includes("member exists")) {
        res.json({
          result: "success",
          msg: `${email} is already subscribed`,
        } satisfies SubscribeResponse);
      } else {
        res.json({
          result: "error",
          msg: body
            ? `${body.title}: ${body.detail}`
            : `Email subscribe failed: ${err}`,
        } satisfies SubscribeResponse);
      }
    }
  }
};

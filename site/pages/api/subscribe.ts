import type {NextApiRequest, NextApiResponse} from "next";

import {mailchimpBaseUrl, mailchimpTags} from "../../config";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const email = req.body.email;
  const tag = req.body.tag;

  if (!email) {
    res.status(400).send(null);
    return;
  }

  const tagId = mailchimpTags[tag];

  const fetchRes = await fetch(
    `${mailchimpBaseUrl}${
      tagId ? `&tags=${tagId}` : ""
    }&EMAIL=${encodeURIComponent(email)}`,
    {
      method: "POST",
      headers: {Accept: "*/*", "Accept-Encoding": "gzip, deflate"},
    }
  );

  res.status(fetchRes.status);

  if (fetchRes.ok) {
    res.json(await fetchRes.json());
  } else {
    res.send(null);
  }
};

import type {NextApiRequest, NextApiResponse} from "next";

import {mailchimpUrl} from "../../config";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const email = req.body.email;

  if (!email) {
    res.status(400).send(null);
    return;
  }

  const fetchRes = await fetch(
    `${mailchimpUrl}&EMAIL=${encodeURIComponent(email)}`,
    {headers: {Accept: "*/*", "Accept-Encoding": "gzip, deflate"}}
  );

  res.status(fetchRes.status);

  if (fetchRes.ok) {
    res.json(await fetchRes.json());
  } else {
    res.send(null);
  }
};

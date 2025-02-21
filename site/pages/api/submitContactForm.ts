import type {NextApiRequest, NextApiResponse} from "next";
import type {ContactFormValues} from "@/components/pricing/pricingModal";

const portalId = process.env.HUBSPOT_PORTAL_ID;
const formGuid = process.env.HUBSPOT_FORM_GUID;

export default async function submitContactForm(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    values: {name, company, email, message},
  }: {values: ContactFormValues} = JSON.parse(await req.body);

  const submitRes = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: [
          {
            name: "firstname",
            value: name,
          },
          {
            name: "company",
            value: company,
          },
          {
            name: "email",
            value: email,
          },
          {
            name: "message",
            value: message,
          },
        ],
      }),
    }
  );

  res.status(submitRes.status);

  if (submitRes.ok) res.json(await submitRes.json());
  else res.send(null);
}

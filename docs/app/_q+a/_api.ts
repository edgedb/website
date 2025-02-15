// main

export function getTags() {
  return _apiCall<{ name: string; count: number }[]>("/tags", {
    tags: ["tags"],
  });
}

export function getAllQnAs() {
  return _apiCall<
    {
      slug: string;
      title: string;
      question: string;
      answer: string;
      tags: string[];
    }[]
  >("/qna", { tags: ["all"] });
}

export function getQnAsByTag(tag: string) {
  return _apiCall<
    {
      slug: string;
      title: string;
      question: string;
      answer: string;
      tags: string[];
    }[]
  >(`/tags/${tag}`, { tags: [`tag-${tag}`] });
}

export function getQnA(slug: string) {
  return _apiCall<{
    title: string;
    question: string;
    answer: string;
    tags: string[];
  }>(`/qna/${slug}`, { tags: [`slug-${slug}`] });
}


// util

async function _apiCall<T>(
  apiPath: string,
  {
    method,
    tags,
    body = null,
  }: {
    method?: string;
    tags?: string[];
    body?: any | null;
  }
): Promise<T> {
  const res = await fetch(new URL(apiPath, process.env.QNA_API_URL), {
    method: method ?? "GET",
    next: {
      tags,
    },
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${process.env.QNA_API_SECRET}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.ok) {
    return res.json();
  }
  throw new Error(
    `api call failed with status ${res.status}: ${await res.text()}`
  );
}

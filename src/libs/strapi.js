export default async function fetchApi(endpoint, isCollectionType = false) {
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.slice(1);
  }

  const url = new URL(
    `${import.meta.env.STRAPI_URL}/api/${endpoint}?populate=*`
  );

  const res = await fetch(url.toString());
  let data = await res.json();

  if (isCollectionType) {
    return data;
  }

  return data.data.attributes;
}

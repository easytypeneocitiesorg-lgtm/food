export default async function handler(req, res) {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).send("No URL");
    }

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    // follow redirects automatically
    const response = await fetch(url, {
      redirect: "follow"
    });

    const finalUrl = response.url;
    const contentType = response.headers.get("content-type") || "text/html";

    const body = await response.text();

    // send back page
    res.setHeader("content-type", contentType);
    res.send(body);

  } catch (e) {
    res.status(500).send("Error: " + e.toString());
  }
}

export default async function handler(req, res) {
  try {
    let { url } = req.query;

    if (!url) return res.status(400).send("No URL");

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const response = await fetch(url, {
      redirect: "follow"
    });

    let text = await response.text();

    // rewrite links (href/src/action)
    text = text.replace(
      /(href|src|action)=["'](.*?)["']/gi,
      (match, attr, link) => {
        if (link.startsWith("http")) {
          return `${attr}="/api/proxy?url=${encodeURIComponent(link)}"`;
        }
        return match;
      }
    );

    // inject script to catch JS redirects
    text = text.replace(
      "</body>",
      `
<script>
(function() {
  const origAssign = window.location.assign;
  const origReplace = window.location.replace;

  function rewrite(url) {
    if (url.startsWith("http")) {
      return "/api/proxy?url=" + encodeURIComponent(url);
    }
    return url;
  }

  window.location.assign = function(url) {
    origAssign.call(window.location, rewrite(url));
  };

  window.location.replace = function(url) {
    origReplace.call(window.location, rewrite(url));
  };

  Object.defineProperty(window.location, "href", {
    set: function(url) {
      origAssign.call(window.location, rewrite(url));
    }
  });
})();
</script>
</body>`
    );

    res.setHeader("content-type", "text/html");
    res.send(text);

  } catch (e) {
    res.status(500).send("Error: " + e.toString());
  }
}

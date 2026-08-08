import { expect, test } from "@playwright/test";

test("protected HLS refreshes denied keys without exposing R2", async ({
  page,
  baseURL,
}, testInfo) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
  const requestedUrls: string[] = [];
  let manifestRequests = 0;
  let keyRequests = 0;

  await page.route(`${origin}/fixture/**`, async (route) => {
    const url = new URL(route.request().url());
    requestedUrls.push(url.toString());

    if (url.pathname === "/fixture/master.m3u8") {
      manifestRequests += 1;
      await route.fulfill({
        contentType: "application/vnd.apple.mpegurl",
        headers: { "Cache-Control": "private, no-store" },
        body:
          "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n" +
          `${origin}/fixture/variant.m3u8?grant=manifest-${manifestRequests}\n`,
      });
      return;
    }
    if (url.pathname === "/fixture/variant.m3u8") {
      await route.fulfill({
        contentType: "application/vnd.apple.mpegurl",
        headers: { "Cache-Control": "private, no-store" },
        body:
          "#EXTM3U\n#EXT-X-TARGETDURATION:6\n" +
          `#EXT-X-KEY:METHOD=AES-128,URI="${origin}/fixture/key?grant=key-${manifestRequests}"\n` +
          `#EXTINF:6,\n${origin}/fixture/segment.ts?grant=media-${manifestRequests}\n` +
          "#EXT-X-ENDLIST\n",
      });
      return;
    }
    if (url.pathname === "/fixture/key") {
      keyRequests += 1;
      await route.fulfill({
        status: keyRequests === 1 ? 403 : 200,
        contentType: "application/octet-stream",
        headers: { "Cache-Control": "private, no-store" },
        body: keyRequests === 1 ? "Forbidden" : "0123456789abcdef",
      });
      return;
    }
    if (url.pathname === "/fixture/segment.ts") {
      await route.fulfill({
        contentType: "video/mp2t",
        headers: { "Cache-Control": "private, no-store" },
        body: Buffer.from([0x47, 0x40, 0x00, 0x10]),
      });
      return;
    }
    await route.fulfill({ status: 404, body: "Not found" });
  });

  await page.setContent(`
    <!doctype html>
    <meta charset="utf-8">
    <video aria-label="Protected HLS fixture" controls></video>
    <output aria-label="fixture status">loading</output>
    <script>
      const video = document.querySelector("video");
      const status = document.querySelector("output");
      window.fixtureState = {
        attachment: "",
        keyDenied: false,
        manifestRefreshes: 0,
        seekAttempted: false,
        seekPreserved: false
      };

      const uriLines = text => text.split(/\\r?\\n/).filter(
        line => line && !line.startsWith("#")
      );
      const attributeUri = text => {
        const match = text.match(/URI="([^"]+)"/);
        return match && match[1];
      };

      async function loadProtectedHls() {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          window.fixtureState.manifestRefreshes += 1;
          const master = await fetch("${origin}/fixture/master.m3u8", {
            credentials: "include",
            cache: "no-store"
          }).then(response => response.text());
          const variantUrl = new URL(uriLines(master)[0], location.href);
          const variant = await fetch(variantUrl, {
            credentials: "include",
            cache: "no-store"
          }).then(response => response.text());
          const keyUrl = attributeUri(
            variant.split(/\\r?\\n/).find(line => line.startsWith("#EXT-X-KEY:"))
          );
          const keyResponse = await fetch(keyUrl, {
            credentials: "include",
            cache: "no-store"
          });
          if (!keyResponse.ok) {
            window.fixtureState.keyDenied = true;
            continue;
          }
          const segmentUrl = new URL(uriLines(variant)[0], location.href);
          await fetch(segmentUrl, { credentials: "omit", cache: "no-store" });

          if ("MediaSource" in window) {
            const mediaSource = new MediaSource();
            video.src = URL.createObjectURL(mediaSource);
            video.dataset.attachment = "blob-mse";
          } else {
            video.src = variantUrl.toString();
            video.dataset.attachment = "native-hls";
          }
          window.fixtureState.attachment = video.dataset.attachment;
          try {
            video.currentTime = 4;
            window.fixtureState.seekAttempted = true;
            window.fixtureState.seekPreserved = video.currentTime === 4;
          } catch {
            window.fixtureState.seekAttempted = false;
          }
          status.value = "ready";
          status.textContent = "ready";
          return;
        }
        throw new Error("key refresh exhausted");
      }
      loadProtectedHls().catch(error => {
        status.value = "error";
        status.textContent = error.message;
      });
    </script>
  `);

  await expect(page.getByLabel("fixture status")).toHaveText("ready");
  const state = await page.evaluate(() => {
    return (window as unknown as {
      fixtureState: {
        attachment: string;
        keyDenied: boolean;
        manifestRefreshes: number;
        seekAttempted: boolean;
        seekPreserved: boolean;
      };
    }).fixtureState;
  });

  expect(["blob-mse", "native-hls"]).toContain(state.attachment);
  if (state.attachment === "blob-mse") {
    await expect(page.getByLabel("Protected HLS fixture")).toHaveAttribute(
      "src",
      /^blob:/
    );
  } else {
    testInfo.annotations.push({
      type: "playback-engine",
      description:
        "WebKit used its native HLS branch; this is Playwright WebKit, not real Safari.",
    });
  }
  expect(state.keyDenied).toBe(true);
  expect(state.manifestRefreshes).toBe(2);
  expect(manifestRequests).toBe(2);
  expect(keyRequests).toBe(2);
  if (state.seekAttempted) expect(state.seekPreserved).toBe(true);
  expect(requestedUrls.join("\n")).not.toMatch(
    /r2\.dev|r2\.cloudflarestorage\.com/i
  );
});

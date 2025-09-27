let activeMembers = [];

function ddmmyy(input) {
  const date = new Date(input);
  return isNaN(date.getTime())
    ? "NA"
    : date
        .toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })
        .substring(0, 10);
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return await res.json();
}

async function fetchLatestTimestamp() {
  const url =
    "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec?sheetid=1MaB1PMP3ouY3Es5ziLgY7dhT3ZSb6oHRgecw3JiJfGw&sheetname=Sheet1";
  const res = await fetch(url, { cache: "no-store" });
  const text = (await res.text()).trim();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.flat(Infinity)[0] : parsed;
  } catch {
    return text;
  }
}

async function cacheData(key, data) {
  const cache = await caches.open("addbook");
  const response = new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
  await cache.put(key, response);
}

async function readCachedData(key) {
  const cache = await caches.open("addbook");
  const response = await cache.match(key);
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchAddBookData() {
  const url =
    "https://script.google.com/macros/s/AKfycbwIVAlRrCTt6z_Ej4W6PHhopFqCq1JvEsSoN2RPqgWY7VXLW0P2pteA1jgVFaWePc2S/exec";
  let data = await fetchJson(url);
  data.shift(); // remove header
  const formatted = data.map(
    ([
      id,
      name,
      add1,
      add2,
      add3,
      district,
      place,
      pincode,
      fixed,
      mobile1,
      mobile2,
      state,
      email,
      srno,
      sbac,
      doj,
      dor,
      spname,
      area,
      blank1,
      dob,
      fampen,
      pensionbr,
      scanned,
      newempid,
      dod,
      blank2,
      blank3,
      blank4,
    ]) => ({
      id,
      name,
      add1,
      add2,
      add3,
      district,
      place,
      pincode,
      fixed,
      mobile1,
      mobile2,
      state,
      email,
      srno,
      sbac,
      doj: ddmmyy(doj),
      dor: ddmmyy(dor),
      spname,
      area,
      blank1,
      dob: ddmmyy(dob),
      fampen,
      pensionbr,
      scanned,
      newempid,
      dod: ddmmyy(dod),
      blank2,
      blank3,
      blank4,
    })
  );
  await cacheData("/custom/addbookdata.json", formatted);
  return formatted;
}

async function fetchPhotoData() {
  const url =
    "https://script.google.com/macros/s/AKfycbw_h5LMGCyIraesAhh6xlkeP8RUz3HO4ga4Q8XZaJhJRpnuQqp3TWUUZyodZPxpeA7A/exec";
  let data = await fetchJson(url);
  data.shift();
  const photos = data.map(([id, photoid]) => ({ id, photoid }));
  await cacheData("/custom/addbookphotodata.json", photos);
  return photos;
}

async function initReport(updateUI) {
  // 1. Load from cache (instant display if available)
  let [addBookData, photoData] = await Promise.all([
    readCachedData("/custom/addbookdata.json"),
    readCachedData("/custom/addbookphotodata.json"),
  ]);

  if (addBookData && photoData) {
    activeMembers = addBookData
      .filter(a => a.name !== "")
      .sort((a, b) => a.name.localeCompare(b.name));

    if (typeof updateUI === "function") updateUI("cache");
  }

  // 2. Check server timestamp in background
  try {
    const serverTimestamp = await fetchLatestTimestamp();
    const localTimestamp = localStorage.getItem("data_updated_at");

    if (!addBookData || !photoData || localTimestamp != serverTimestamp) {
      [addBookData, photoData] = await Promise.all([
        fetchAddBookData(),
        fetchPhotoData(),
      ]);
      localStorage.setItem("data_updated_at", serverTimestamp);

      activeMembers = addBookData
        .filter(a => a.name !== "")
        .sort((a, b) => a.name.localeCompare(b.name));

      if (typeof updateUI === "function") updateUI("fresh");
    }
  } catch (err) {
    console.error("Background refresh failed", err);
  }
}


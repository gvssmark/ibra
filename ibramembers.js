url = 'https://script.google.com/macros/s/AKfycbzI9SDFOzYLYKRKJTlse0XpsEiF8XfbyxwUUH22evlGkEPDIt2V/exec'
async function getMyData() {response = await fetch(url)
data = await response.json()
tempData = data["user"]
activeMembers = tempData.filter(a => a.name !== "").sort(function (a, b) { return a.name.localeCompare(b.name) });

activeMembers.forEach(function (element) { 
element.IBorEAB = (element.area.substr(-3).toUpperCase() === 'EAB' ? "EAB" : "IB"), 
element.pentype = (element.fampen.length > 0 ? "fam" : "ser") })
}
getMyData()

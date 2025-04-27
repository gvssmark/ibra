url='https://script.google.com/macros/s/AKfycbwIVAlRrCTt6z_Ej4W6PHhopFqCq1JvEsSoN2RPqgWY7VXLW0P2pteA1jgVFaWePc2S/exec'
async function getMyData() {response = await fetch(url)
const ddmmyy = input => !isNaN(new Date(input).getTime()) ? new Date(input).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }).substring(0,10) : '';
data = await response.json()
data = data.map(([id,name,add1,add2,add3,district,place,pincode,fixed,mobile1,mobile2,state,email,srno,sbac,doj,dor,spname,area,blank1,dob,fampen,pensionbr,scanned,newempid,dod,blank2,blank3,blank4
])=>({id,name,add1,add2,add3,district,place,pincode,fixed,mobile1,mobile2,state,email,srno,sbac,doj:ddmmyy(doj),dor:ddmmyy(dor),spname,area,blank1,dob:ddmmyy(dob),fampen,pensionbr,scanned,newempid,dod:ddmmyy(dod),blank2,blank3,blank4
}))
activeMembers = data.filter(a => a.name !== "").sort(function (a, b) { return a.name.localeCompare(b.name) });
activeMembers.forEach(function (element) { 
element.IBorEAB = (element.area.substr(-3).toUpperCase() === 'EAB' ? "EAB" : "IB"), 
element.pentype = (element.fampen.length > 0 ? "fam" : "ser") })
console.clear()
console.table(activeMembers[0])
//if(activeMembers.length>0){document.getElementById("loader").style.display = "none"}}
activeMembers.length>0 ? document.getElementById("loader").style.display = "none" : ""
}
getMyData()

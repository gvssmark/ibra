
url='https://script.google.com/macros/s/AKfycbwIVAlRrCTt6z_Ej4W6PHhopFqCq1JvEsSoN2RPqgWY7VXLW0P2pteA1jgVFaWePc2S/exec'
            async function getMyData() {
              
            function ddmmyy(input) {const date = new Date(input);
              return isNaN(date.getTime()) ? 'Not Available' : date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }).substring(0,10);}
            response = await fetch(url)
 tdata = await response.json()
 data = tdata.map(([id,name,add1,add2,add3,district,place,pincode,fixed,mobile1,mobile2,state,email,srno,sbac,doj,dor,spouse,area,blank,dob,fampen,pensionbr,scanned])=>
({id,name,add1,add2,add3,district,place,pincode,fixed,mobile1,mobile2,state,email,srno,sbac,doj:ddmmyy(doj),dor:ddmmyy(dor),spouse,area,blank,dob:ddmmyy(dob),fampen,pensionbr,scanned}))
activeMembers =data.filter(a => a.name !== "").sort(function (a, b) { return a.name.localeCompare(b.name) });
console.log(activeMembers)                        
}

getMyData()


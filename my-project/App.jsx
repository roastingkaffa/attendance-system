
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCamera from "./QRCamera";
import axios from "axios";

const App = () => {
  const [page, setPage] = useState(localStorage.getItem("loggedIn") ? "dashboard" : "login");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [password, setPassword] = useState("");
  const [gps, setGps] = useState(null);
  const [records, setRecords] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ date: "", duration: "Full Day", reason: "" });
  const [mode, setMode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false); // Show Failed status
  // const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [employeeData, setEmployeeData] = useState({ name: "", id: "" })
  const [relationId, setRelationId] = useState("");
  const [isPostSent, setIsPostSent] = useState(false);



  useEffect(() => {
    getLocation();
    const savedRecords = localStorage.getItem("records");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setScanning(false);
      setPage("dashboard");
      setCountdown(null);
      setShowSuccess(false);
    }
  }, [countdown]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setGps({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => toast.error("無法取得 GPS 位置，請確認定位權限已開啟")
      );
    } else {
      toast.error("您的瀏覽器不支援定位功能");
    }
  };

const handleLogin = async () => {
  try {
    const response = await axios.post("http://localhost:8000/login/", {
      userId,
      password,
    }, {
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
    });
    localStorage.setItem("authToken", response.data.token);
    localStorage.setItem("userId", userId);
    sessionStorage.setItem("password", password);
    try {
      const relationResponse = await handleRelationTable(userId);
      setRelationId(relationResponse[0]?.id);
    } catch (error) {
      console.error("獲取 relationId 時出錯:", error);
      toast.error("獲取 relationId 失敗");
    }

    if (response.status === 200) {
      setPage("dashboard");
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  } catch (error) {
    console.error("登入失敗，請檢查帳號密碼", error);
    toast.error("登入失敗，請檢查帳號密碼");
  }
};

const handleLogout = async () => {
  try {
    const response = await axios.post("http://localhost:8000/logout/");
    if (response.status === 200) {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("userId");
      setPage("login");
      setUserId("");
      setPassword("");
      setGps(null);
      toast.success("登出成功");
    }
  } catch (error) {
    console.error("登出失敗:", error);
    toast.error("登出失敗");
  }
};

  const startScan = (selectedMode) => {
    setMode(selectedMode);
    setScanning(true);
  };

  const handleScan = (data) => {
    setScanning(false)
    let qrData = "";
    try {
      console.log("掃描到的資料:", data);
      const [lat, lng] = data.split(", ").map(Number);
      !isNaN(lat) && lat >= -90 && lat <= 90
      !isNaN(lng) && lng >= -180 && lng <= 180;
      qrData = { lat, lng };
      console.log("qrData:", typeof(qrData));
      console.log("Parsed QR Code Data:", qrData);
    } catch {
      toast.error("掃到無效的 QR Code");
      setScanning(false);
    }
    verifyLocation(qrData);
  };

    const updateAttendance = async (method, record, url) => {
      const response = await axios({
        method: method,
        url: url,
        data: record,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${userId}:${password}`)}`
        },
        withCredentials: true
      });
      if (method === "post" && response.status === 201 || method === "patch" && response.status === 200){
        toast.success("打卡成功！");
      } else {
        toast.error("打卡失敗！");
      }
  }

  const verifyLocation = async (qrData) => {
    if (!gps) {
      toast.error("尚未取得目前 GPS 位置");
      getLocation()
    }
    console.log("Current GPS:", gps);
    console.log("gps.lng:", gps.lng);
    console.log("gps.lat:", gps.lat);
    console.log("qrData.lat:", qrData.lat);
    console.log("qrData.lng:", qrData.lng);

    const distance = getDistance(gps.lat, gps.lng, qrData.lat, qrData.lng);
    console.log("Distance:", distance);
    const currentTime = (new Date().toISOString()).slice(0, 16).replace('T', ' ');
    console.log("currentTime", currentTime)
    console.log("today", currentTime.slice(0, 10))
    const today = currentTime.slice(0, 10)
    const location = `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`
    let attendance = {};

  //   const now = new Date();
  //   if (distance <= 2000) {
  //     const newRecord = {
  //       type: mode === "in" ? "Clock In" : "Clock Out",
  //       date: now.toISOString().split("T")[0],
  //       time: now.toLocaleTimeString(),
  //       location: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
  //     };
  //     setRecords((prev) => [...prev, newRecord]);
  //     toast.success("打卡完成，5秒後返回首頁");
  //     setShowSuccess(true);
  //     setCountdown(5);
  //   } else {
  //     toast.error("你不在正確位置打卡");
  //     setShowFail(true);                    // show read x status
  //     setTimeout(() => {
  //       setShowFail(false);                // Auto clear
  //       setScanning(false);                // Return Previous pace
  //     }, 2000);
  //   }
  //   setMode("");
  // };
  
    if (distance <= 2000) {
      setScanning(false)
      if (mode === "in"){
        console.log("in")
        const url = "http://localhost:8000/attendance/"
        attendance = {
          relation_id: relationId,
          date: today,
          checkin_time: currentTime,
          checkout_time: currentTime,
          checkin_location: location,
          checkout_location: location,
          work_hours: 0
        };
        console.log(isPostSent)
        if (!isPostSent){
          updateAttendance("post", attendance, url)
          setIsPostSent(true)
          console.log(`isPostSent2: ${isPostSent}`)
        }
      } else {
        console.log("else")
        let attendanceData = "";
        try {
          const response = await axios.get(`http://localhost:8000/attendance/`, {
            params: { days: 0 },
            headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
            withCredentials: true,
          });
          attendanceData = response.data;
        } catch (err) {
          console.error("取得出勤資料錯誤:", err);
        }
        attendanceData = attendanceData[0]
        if (attendanceData) {
          const id = attendanceData.id
          const checkinTime = attendanceData.checkin_time.slice(0, 16).replace('T', ' ');
          const work_hours = ((new Date(currentTime) - new Date(checkinTime)) / 3600000).toFixed(2);
          const url = `http://localhost:8000/attendance/${id}/`
          attendance = {
            date: today,
            checkout_time: currentTime,
            checkout_location: location,
            work_hours: work_hours
          };
          console.log(JSON.stringify(attendance))
          updateAttendance("patch", attendance, url)
        }
      }
      setRecords((prev) => [...prev, attendance]);
      toast.success("打卡完成，5秒後返回首頁");
      setShowSuccess(true);
      setCountdown(5);
      setScanning(false);
    } else {
      toast.error("你不在正確位置打卡");
      setShowFail(true);                    // show read x status
      setTimeout(() => {
        setShowFail(false);                // Auto clear
        setScanning(false);                // Return Previous pace
      }, 2000);
    }
    setMode("");
  };

  const simulateScan = () => {
    const simulatedData = { lat: 25.1688, lng: 121.4587 };
    handleScan(JSON.stringify(simulatedData));
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    console.log("dLat:", dLat);
    console.log("dLng:", dLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handEmployee = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/employees/${userId}/`, {
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
        withCredentials: true,
      });
      const data = response.data;
      setEmployeeData({
        name: data.username,
        id: data.employee_id,
      });
    } catch (err) {
      console.error("取得員工資料失敗:", err);
    }
  };

  useEffect(() => {
    if (page === "dashboard") {
      handEmployee();
    }
  }, [page]);

  const handleRelationTable = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/relation/`, {
        params: { employee_id: userId},
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
        withCredentials: true,
      });
      console.log("handleRelationTable API 回應:", response.data);
      return response.data;
    } catch (error) {
      console.error("取得員工關係資料失敗:", error);
      toast.error("取得員工關係資料失敗");
      return {};
    }
  };


  const submitLeave = async () => {
    if (!leaveForm.date || !leaveForm.duration || !leaveForm.reason) {
      toast.error("請填寫完整請假資料");
      return;
    }

    const start_work_time = `${leaveForm.date} 08:00:00`
    const end_work_time = `${leaveForm.date} 17:00:00`
    const middle_time = `${leaveForm.date} 12:00:00`
    const noon_time = `${leaveForm.date} 13:00:00`

    let start_time = "";
    let end_time = "";

    if (leaveForm.duration === "Morning") {
      start_time = start_work_time
      end_time = middle_time
    } else if (leaveForm.duration === "Afternoon") {
      start_time = noon_time
      end_time = end_work_time
    } else {
      start_time = start_work_time
      end_time = end_work_time
    }
    
    console.log("請假紀錄:", start_time, end_time);

    const relation_id = (await handleRelationTable())[0].id;
    let leave_hours = ((new Date(end_time) - new Date(start_time)) / 3600000).toFixed(2);
    if (leaveForm.duration === "Full Day") {
      leave_hours = leave_hours -1
    }
    console.log("leave_hours:", leave_hours);
    const leave = {
      relation_id: relation_id,
      date: leaveForm.date,
      start_time: start_time,
      end_time: end_time,
      leave_reason: leaveForm.reason,
      leave_hours: leave_hours
    };

    console.log("leave:", JSON.stringify(leave));
    try {
      setRecords(prev => [...prev, leave]);
      setLeaveForm({ date: "", duration: "Full Day", reason: "" });
      const response = await axios.post('http://localhost:8000/leave/', leave, 
        {headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
        withCredentials: true,
      });
      if (response.status === 201){
        toast.success("請假成功！");
      } else {
        toast.error("請假失敗！");
      }
    } catch (error) {
      console.error("請假執行失敗:", error);
      toast.error("請假執行失敗");
    }
    setPage("dashboard");
  };

  const groupedRecords = [...attendanceRecords, ...leaveRecords].reduce((acc, record) => {
    const formattedDate = record.date || new Date(record.start_time).toISOString().split('T')[0];
    acc[formattedDate] = acc[formattedDate] || { attendance: [], leave: [] };

    if (record.checkin_time || record.checkout_time) {
      acc[formattedDate].attendance.push(record);
    } else if (record.start_time || record.end_time) {
      acc[formattedDate].leave.push(record);
    }
    return acc;
  }, {});


    const handleAttendance = async (day) => {
    try {
      const response = await axios.get(`http://localhost:8000/attendance/`, {
        params: { employee_id: userId, days: day },
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
        withCredentials: true,
      });

      console.log("API 回應:", response.data);
      return response.data;
    } catch (error) {
      console.error("取得考勤紀錄失敗:", error);
      return {};
    }
  };

  
  useEffect(() => {
    if (page === "view-records") {
      const handleLeave = async () => {
        try { 
          const response = await axios.get(`http://localhost:8000/leave/`, {
            params: { employee_id: userId, days: 3 },
            headers: { "Content-Type": "application/json", "Authorization": `Basic ${btoa(`${userId}:${password}`)}` },
            withCredentials: true,
          });
          console.log("handleLeave API 回應:", response.data);
          return response.data;
        } catch (error) {
          console.error("取得請假紀錄失敗:", error);
          return {};
        }
      };
  
      axios.all([handleAttendance(3), handleLeave()])
        .then(axios.spread((attendanceRes, leaveRes) => {
          console.log("🚀 考勤 API 回應:", attendanceRes);
          console.log("🚀 請假 API 回應:", leaveRes);
      
          setAttendanceRecords(Array.isArray(attendanceRes) ? attendanceRes : []);
          setLeaveRecords(Array.isArray(leaveRes) ? leaveRes : []);
        }))
        .catch(error => {
          console.error("載入 API 失敗:", error);
        });
    }
  }, [page, userId, password]);
  

  if (page === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">宏全打卡系統</h1>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-80">
          <input type="text" placeholder="Enter your employee ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="border p-2 mb-4 w-full rounded" />
          <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-6 w-full rounded" />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
          <div className="text-xs text-gray-400 mt-4">
            {gps ? (<p>Your Current Location<br />{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</p>) : (<p>Locating...</p>)}
          </div>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <div className="text-xl font-semibold text-gray-500 mb-2">員工姓名: {employeeData.name}</div>
        <div className="text-xl font-semibold text-gray-500 mb-2">員工工號: {employeeData.id}</div>
        <h2 className="text-2xl font-bold mb-4">掃描 GPS QR Code</h2>
        <QRCamera onScan={handleScan} />
        <button onClick={simulateScan} className="mt-4 bg-gray-300 text-black py-2 px-4 rounded">
          模擬 GPS QR Scan
        </button>

        {showSuccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-100 bg-opacity-80">
            <div className="text-green-600 text-6xl mb-4 animate-bounce">✔️</div>
            <div className="text-green-700 text-xl font-bold">打卡成功！</div>
          </div>
        )}

        {showFail && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 bg-opacity-80">
            <div className="text-red-600 text-6xl mb-4 animate-bounce">❌</div>
            <div className="text-red-700 text-xl font-bold">打卡失敗！</div>
          </div>
        )}

        {countdown !== null && (
          <div className="text-red-500 mt-4 text-lg font-semibold">
            將在 {countdown} 秒後返回首頁...
          </div>
        )}
      </div>
    );
  }

  if (page === "apply-leave") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">Leave Application</h1>
        <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} className="border p-2 mb-4 w-full rounded" />
        <select value={leaveForm.duration} onChange={(e) => setLeaveForm({ ...leaveForm, duration: e.target.value })} className="border p-2 mb-4 w-full rounded">
          <option>Full Day</option>
          <option>Morning</option>
          <option>Afternoon</option>
        </select>
        <textarea placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="border p-2 mb-4 w-full rounded"></textarea>
        <button onClick={submitLeave} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Submit Leave</button>
        <button onClick={() => setPage("dashboard")} className="text-blue-600 mt-4 block w-full">Back</button>
      </div>
    );
  }

  if (page === "view-records") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">Attendance Records</h1>
        {Object.keys(groupedRecords).length > 0 ? (
          Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a)).map((date) => (
              <div key={date} className="mb-6">
                <h2 className="text-lg font-bold mb-2">{date}</h2>

                {/* 🔥 顯示考勤紀錄 */}
                  {groupedRecords[date].attendance.map((record, idx) => {
                    const formattedCheckinTime = record.checkin_time ? new Date(record.checkin_time).toLocaleString("zh-CN", { timeZone: "Asia/Taipei"}) : "無出勤紀錄";
                    const formattedCheckoutTime = (record.checkout_time && record.checkin_time !== record.checkout_time)  ? new Date(record.checkout_time).toLocaleString("zh-CN", { timeZone: "Asia/Taipei" }) : "無下班紀錄";
                    return (
                      <div
                        key={idx} className={`p-3 rounded mb-2 ${!record.checkout_time ? "bg-yellow-100" : "bg-green-100"}`}>
                        <p className="text-gray-500 text-sm">上班: {formattedCheckinTime}</p>
                        <p className="text-gray-500 text-sm">下班: {formattedCheckoutTime}</p>
                      </div>
                    );
              })}

                {/* 🔥 顯示請假紀錄 */}
                {groupedRecords[date]?.leave?.length > 0 ? (
                  <div className="bg-red-100 p-3 rounded mt-2">
                    <h3 className="font-bold text-red-600">請假紀錄：</h3>
                    {groupedRecords[date].leave.map((leave, idx) => {
                      const formattedStartTime = new Date(leave.start_time).toLocaleString("zh-CN", {
                        timeZone: "Asia/Taipei",
                      });
                      const formattedEndTime = new Date(leave.end_time).toLocaleString("zh-CN", {
                        timeZone: "Asia/Taipei",
                      });
                      return (
                        <div key={idx} className="text-sm text-red-500">
                          <p>
                            {leave.reason}（{formattedStartTime} ~ {formattedEndTime}）
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">沒有請假資料</p>
                )}
              </div>
            ))
        ) : (
          <p className="text-gray-600">沒有考勤紀錄</p>
        )}
        <button
          onClick={() => setPage("dashboard")}
          className="text-blue-600 mt-4 block w-full"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">Geo Clock-In Buddy</h1>
        <button onClick={handleLogout} className="text-blue-600">Logout</button>
      </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Attendance System</h2>
        <p className="text-gray-500 mb-4">{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="text-xl font-semibold text-gray-500 mb-2">員工姓名: {employeeData.name}</div>
        <div className="text-xl font-semibold text-gray-500 mb-2">員工工號: {userId}</div>
        <div className="flex space-x-4 mb-6">
          <button onClick={() => startScan("in")} className="bg-green-500 text-white px-4 py-2 rounded">Clock In</button>
          <button onClick={() => startScan("out")} className="bg-red-500 text-white px-4 py-2 rounded">Clock Out</button>
        </div>

        <div className="flex space-x-4">
          <button onClick={() => setPage("apply-leave")} className="flex-1 bg-gray-200 py-2 rounded">Apply Leave</button>
          <button onClick={() => setPage("view-records")} className="flex-1 bg-gray-200 py-2 rounded">View Records</button>
        </div>
      </div>
    </div>
  );
};

export default App;


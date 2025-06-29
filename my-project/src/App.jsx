
import React, { useState, useEffect, useRef } from "react";
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
  const [scanning, setScanning] = useState(false);
  const [countdown] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false); // Show Failed status
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [employeeData, setEmployeeData] = useState({ name: "", id: "" })
  const [relationId, setRelationId] = useState("");
  const scanSession = useRef(0);
  const hasScanned = useRef(false);
  const modeRef = useRef("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");


  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const csrftoken = getCookie("csrftoken");


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
    const response = await axios.post("http://13.112.197.109:8000/login/", {
      "userId": userId,
      "password": password,
    }, {
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      withCredentials: true,
    });
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
    const response = await axios.post("http://13.112.197.109:8000/logout/");
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

  const updateAttendance = async (method, record, url) => {
    const response = await axios({
      method: method,
      url: url,
      data: record,
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      withCredentials: true
    });
    if (method === "post" && response.status === 201 || method === "patch" && response.status === 200){
      toast.success("打卡成功！");
    } else {
      toast.error("打卡失敗！");
    }
  }

  const startScan = (selectedMode) => {
    hasScanned.current = false;
    modeRef.current = selectedMode;
    scanSession.current += 1;
    setScanning(true);
  };

  const handleScan = (data) => {
    if (hasScanned.current || !data) return;
    hasScanned.current = true;
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
      hasScanned.current = false;
    }
    verifyLocation(qrData);
  };

  const getTodayAttendance = async () => {
    try {
      const response = await axios.get(`http://13.112.197.109:8000/attendance/`, {
        params: { days: 0 },
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("取得出勤資料錯誤:", err);
      return [];
    }
  }

  const getCompanies = async () => {
    try {
      const response = await axios.get(`http://13.112.197.109:8000/companies/`, {
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("取得出勤資料錯誤:", err);
      return [];
    }
  }

  const verifyLocation = async (qrData) => {
    if (!gps) {
      toast.error("尚未取得目前 GPS 位置");
      return;
    }

    const checkLocation = async () => {
      const companies = await getCompanies()
      console.log('companies', JSON.stringify(companies))
      return companies.some(company => {
        return company.latitude === qrData.lat.toString() && company.longitude === qrData.lng.toString();
      });
    }

    const distance = getDistance(gps.lat, gps.lng, qrData.lat, qrData.lng);
    const currentTime = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false // 24小時制
    }).replace(',', '').replace(/\//g, '-');
    console.log("currentTime", currentTime)
    const formatCurrentTime = currentTime.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, "$3/$1/$2 $4:$5:$6");
    const today = formatCurrentTime.slice(0, 10)
    console.log("Distance:", distance);
    console.log("formatCurrentTime", formatCurrentTime)
    console.log("today", today)
    const location = `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`
    let newRecord = {};
    let noRecord = false;
    
    console.log("checkLocation()", checkLocation())
    const isLocationValid = await checkLocation()

    if (distance <= 2000 && isLocationValid) {
      const todayAttendance = await getTodayAttendance()
      console.log("todayAttendance:", todayAttendance)
      console.log("todayAttendance len:", todayAttendance.length)
      if (modeRef.current === "in" && todayAttendance.length === 0){
        console.log(modeRef.current)
        const url = "http://13.112.197.109:8000/attendance/"
        newRecord = {
          relation_id: relationId,
          date: today,
          checkin_time: formatCurrentTime,
          checkout_time: formatCurrentTime,
          checkin_location: location,
          checkout_location: location,
          work_hours: 0
        };
        updateAttendance("post", newRecord, url)
      } else if (modeRef.current === "out" && todayAttendance.length === 1) {
        console.log(modeRef.current)
        newRecord = todayAttendance[0]
        console.log("newRecord", newRecord)
        if (newRecord) {
          const id = newRecord.id
          const checkinTime = newRecord.checkin_time.slice(0, 16).replace('T', ' ');
          const work_hours = ((new Date(formatCurrentTime) - new Date(checkinTime)) / 3600000).toFixed(2);
          const url = `http://13.112.197.109:8000/attendance/${id}/`
          newRecord = {
            date: today,
            checkout_time: formatCurrentTime,
            checkout_location: location,
            work_hours: work_hours
          };
          console.log(JSON.stringify(newRecord))
          updateAttendance("patch", newRecord, url)
        }
      } else {
        console.log("else")
        newRecord = todayAttendance[0]
        if (todayAttendance.length === 0){
          noRecord = true
        } else {
          if (newRecord) {
            const id = newRecord.id
            const url = `http://13.112.197.109:8000/attendance/${id}/`
            newRecord = {
              date: today,
              checkin_time: formatCurrentTime,
              checkout_time: formatCurrentTime,
              checkout_location: location,
              work_hours: 0
            };
            console.log(JSON.stringify(newRecord))
            updateAttendance("patch", newRecord, url)
          }
        }
      }
      if (noRecord){
        toast.error("沒有上班打卡紀錄");
        setShowFail(true);                    // show read x status
        setTimeout(() => {
          setShowFail(false);                // Auto clear
          setScanning(false);                // Return Previous pace
        }, 2000);
      } else {
        setRecords((prev) => [...prev, newRecord]);
        toast.success("打卡完成，5秒後返回首頁");
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setScanning(false);
          setPage("dashboard");
          hasScanned.current = false;
        }, 5000);
      }
    } else {
      toast.error("你不在正確位置打卡");
      setShowFail(true);                    // show read x status
      setTimeout(() => {
        setShowFail(false);                // Auto clear
        setScanning(false);                // Return Previous pace
      }, 2000);
    }
  };

  const simulateScan = () => {
    const simulatedData = "24.99132303960377, 121.51194818378671"
    // const simulatedData = { lat: 24.99132303960377, lng: 121.51194818378671 };
    // handleScan(JSON.stringify(simulatedData));
    handleScan(simulatedData);
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const handEmployee = async () => {
      try {
        const response = await axios.get(`http://13.112.197.109:8000/employees/${userId}/`, {
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
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

    if (page === "dashboard") {
      handEmployee();
    }
  }, [page, userId, password]);
  
  const handleRelationTable = async () => {
    try {
      const response = await axios.get(`http://13.112.197.109:8000/relation/`, {
        params: { employee_id: userId},
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
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
    console.log('Authorization:', `Basic ${btoa(`${userId}:${password}`)}`);
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
      const response = await axios.post('http://13.112.197.109:8000/leave/', leave, 
        {
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
          withCredentials: true,
        }
      );
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
      const response = await axios.get(`http://13.112.197.109:8000/attendance/`, {
        params: { employee_id: userId, days: day },
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
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
          const response = await axios.get(`http://13.112.197.109:8000/leave/`, {
            params: { employee_id: userId, days: 3 },
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
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

  const changePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("請填寫密碼");
      return;
    }
    try {
      console.log('oldPassword:', `${oldPassword}`);
      console.log('newPassword:', `${newPassword}`);

      const response = await axios.post(`http://13.112.197.109:8000/change_password/`, {
        old_password: oldPassword,
        new_password: newPassword,
        }, {
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
          withCredentials: true
        });
      if (response.status === 200){
        toast.success("變更密碼成功！");
        setOldPassword("");
        setNewPassword("");
      } else {
        toast.error("變更密碼失敗！");
      }
    } catch (error) {
      console.error("變更密碼執行失敗:", error);
      toast.error("變更密碼執行失敗");
    }
    setPage("dashboard");
  };

  const forgotPassword = async () => {
    if (!email) {
      toast.error("請輸入Email");
      return;
    }
    try {
      const response = await axios.post(`http://13.112.197.109:8000/forgot_password/`, { email });
      if (response.status === 200){
        toast.success("臨時密碼已寄出");
      } else {
        toast.error("送出失敗，請稍後再試");
      }
    } catch (error) {
      console.error("變更密碼執行失敗:", error);
      toast.error("變更密碼執行失敗");
    }
    setEmail("");
    setPage("login");
  };

  if (page === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">宏全打卡系統</h1>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-80">
          <input type="text" placeholder="請輸入員工編號" value={userId} onChange={(e) => setUserId(e.target.value)} className="border p-2 mb-4 w-full rounded" />
          <input type="password" placeholder="請輸入密碼" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-6 w-full rounded" />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">登入</button>
          <button onClick={() => setPage("forgot-password")} className="mt-3 text-sm text-blue-600">忘記密碼？</button>
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
        <QRCamera key={scanSession.current} onScan={handleScan} />
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
        <h1 className="text-2xl font-bold mb-4">請假</h1>
        <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} className="border p-2 mb-4 w-full rounded"/>
        <select value={leaveForm.duration} onChange={(e) => setLeaveForm({ ...leaveForm, duration: e.target.value })} className="border p-2 mb-4 w-full rounded">
          <option>整天</option>
          <option>早上</option>
          <option>下午</option>
        </select>
        <textarea placeholder="請假原因" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="border p-2 mb-4 w-full rounded"></textarea>
        <button onClick={submitLeave} className="bg-blue-600 text-white px-4 py-2 rounded w-full">送出</button>
        <button onClick={() => setPage("dashboard")} className="text-blue-600 mt-4 block w-full">返回</button>
      </div>
    );
  }

  if (page === "change-password") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">變更密碼</h1>
        <input type="password" placeholder="請輸入舊密碼" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
        className="border p-2 mb-4 w-full rounded"/>
        <input type="password" placeholder="請輸入新密碼" value={newPassword} onChange={e => setNewPassword(e.target.value)}
        className="border p-2 mb-4 w-full rounded"/>
        <button onClick={changePassword} className="bg-blue-600 text-white px-4 py-2 rounded w-full">送出</button>
        <button onClick={() => setPage("dashboard")} className="text-blue-600 mt-4 block w-full">返回</button>
      </div>
    );
  }

  if (page === "forgot-password") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-4">
        <h1 className="text-2xl font-bold mb-4 text-yellow-700">忘記密碼</h1>
        <div className="bg-white p-6 rounded-2xl shadow-xl w-80">
          <input
            type="email"
            placeholder="請輸入註冊 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border p-2 mb-4 w-full rounded"
          />
          <button onClick={forgotPassword} className="bg-yellow-600 text-white px-4 py-2 rounded w-full hover:bg-yellow-700">
            寄送臨時密碼
          </button>
          <button onClick={() => setPage("login")} className="text-yellow-600 mt-4 block w-full text-sm">返回登入頁</button>
        </div>
      </div>
    )
  }


  if (page === "view-records") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">出缺勤紀錄</h1>
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
                  <div className="bg-gray-100 p-3 rounded mt-2">
                    <h3 className="font-bold text-gray-600">請假紀錄：</h3>
                    {groupedRecords[date].leave.map((leave, idx) => {
                      const formattedStartTime = new Date(leave.start_time).toLocaleString("zh-CN", {
                        timeZone: "Asia/Taipei",
                      });
                      const formattedEndTime = new Date(leave.end_time).toLocaleString("zh-CN", {
                        timeZone: "Asia/Taipei",
                      });
                      return (
                        <div key={idx} className="text-sm text-gray-500">
                          <p>
                            {formattedStartTime} ~ {formattedEndTime}
                          </p>
                          <p>
                            {leave.leave_reason}
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
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <h1 className="text-2xl font-bold text-blue-700 text-center mb-4">考勤系統</h1>
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setPage("change-password")} className="text-blue-600 ml-auto">變更密碼</button>
        <button onClick={handleLogout} className="text-blue-600">登出</button>
      </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <p className="text-gray-500 mb-4">{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="text-xl font-semibold text-gray-500 mb-2">員工姓名: {employeeData.name}</div>
        <div className="text-xl font-semibold text-gray-500 mb-2">員工工號: {userId}</div>
        <div className="flex space-x-4 my-6">
          <button onClick={() => startScan("in")} className="flex-1 bg-green-500 text-white px-4 py-2 rounded">上班打卡</button>
          <button onClick={() => startScan("out")} className="flex-1 bg-red-500 text-white px-4 py-2 rounded">下班打卡</button>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setPage("apply-leave")} className="flex-1 bg-gray-200 py-2 rounded">請假</button>
          <button onClick={() => setPage("view-records")} className="flex-1 bg-gray-200 py-2 rounded">查看出勤紀錄</button>
        </div>
      </div>
    </div>
  );
};

export default App;

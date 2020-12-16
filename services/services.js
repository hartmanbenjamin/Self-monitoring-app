import { executeQuery } from "../database/database.js";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

let message = 'Hello service world!';

const getHello = () => {
    return message;
}

const setHello = (newMessage) => {
    message = newMessage;
}

const authenticate = async(username, password) => {
    const data = {};
    let res = await executeQuery("SELECT * FROM users WHERE username = $1", username);
    if (res.rowCount > 0) { // the username exists
        res = res.rowsOfObjects()[0];
        // console.log(`db: ${res.password}, request: ${password}`);
        const comp = await compare(password, res.password)
        if (comp) { // the passwords match
            // console.log('passwords match');
            return data;
        } else { // wrong password
            // console.log('Wrong password');
            data.username = username;
            data.wrongpass = true;
            return data;
        }
    } else { // The user doesn't exist
        // console.log('User does not exist');
        data.username = username;
        data.wrongpass = false;
        return data;
    }

}


// Authenticate looks if there is already another user with the
// same username, and returns false if a new user cannot be created

const register = async(username, password) => {
    const existing = await executeQuery("SELECT * FROM users WHERE username = $1;", username);
    if (existing.rowCount > 0) {
        // There is already a user with that username
        // console.log('Taken username');
        return false;
    } else {
        // That username is free
        // console.log('Free username');
        const pwhash = await hash(password);
        await executeQuery("INSERT INTO users (username, password) VALUES ($1, $2);", username, pwhash);
        return true;
    }
}

const logMorning = async(username, date, sleep_duration, sleep_quality, mood) => {
    let id = await executeQuery("SELECT id FROM users WHERE username = $1;",username);
    id = id.rowsOfObjects()[0].id;
    const done_already = await executeQuery("SELECT * FROM morning WHERE user_id = $1 AND date = $2;", id, date);
    if (done_already.rowCount > 0 ) { // The report has been done once today, delete the old one
        await executeQuery("DELETE FROM morning WHERE user_id = $1 AND date = $2;", id, date);
    }
    
    await executeQuery("INSERT INTO morning (user_id, date, sleep_duration, sleep_quality, mood) VALUES ($1, $2, $3, $4, $5);", id, date, sleep_duration, sleep_quality, mood);
}

const getWeekSummary = async(user_id, date = new Date()) => {
    
    let year2 = date.getFullYear();
    let month2 = date.getMonth() + 1;
    let day2 = date.getDate();
    const date2 = `${year2}-${month2}-${day2}`;

    date.setDate(date.getDate() - 7);
    let year1 = date.getFullYear();
    let month1 = date.getMonth() + 1;
    let day1 = date.getDate() + 1;
    const date1 = `${year1}-${month1}-${day1}`;

    // console.log(`date1: ${date1}\ndate2: ${date2}\nuser_id: ${user_id}`);

    let res = await executeQuery("SELECT sd_avg, sq_avg, st_avg, sp_avg FROM (SELECT AVG(studying) AS st_avg, AVG(sports) AS sp_avg FROM evening WHERE date >= $1 AND date <= $2 AND user_id = $3) AS e, (SELECT AVG(sleep_duration) AS sd_avg, AVG(sleep_quality) AS sq_avg FROM morning WHERE date >= $1 AND date <= $2 AND user_id = $3) AS m", date1, date2, Number(user_id));
    res = res.rowsOfObjects()[0];
    res.sd_avg = Math.round(res.sd_avg * 100) / 100;
    res.sq_avg = Math.round(res.sq_avg * 100) / 100;
    res.sp_avg = Math.round(res.sp_avg * 100) / 100;
    res.st_avg = Math.round(res.st_avg * 100) / 100;
    let m_avg = await executeQuery("WITH T2 AS (SELECT mood FROM evening WHERE date >= $1 AND date <= $2 AND user_id = $3 UNION ALL SELECT mood FROM morning WHERE date >= $1 AND date <= $2 AND user_id = $3) SELECT AVG(mood) FROM T2;", date1, date2, Number(user_id));
    m_avg = m_avg.rowsOfObjects()[0];
    res.m_avg = m_avg.avg;
    res.m_avg = Math.round(res.m_avg * 100) / 100;
    res.date1 = date1;
    res.date2 = date2;
    return res;   
}

const getMonthSummary = async(user_id, date = new Date()) => {
    
    let year2 = date.getFullYear();
    let month2 = date.getMonth() + 1;
    let day2 = date.getDate();
    const date2 = `${year2}-${month2}-${day2}`;

    date.setMonth(date.getMonth() - 1);
    let year1 = date.getFullYear();
    let month1 = date.getMonth() + 1;
    let day1 = date.getDate();
    const date1 = `${year1}-${month1}-${day1}`;

    // console.log(`date1: ${date1}\ndate2: ${date2}\nuser_id: ${user_id}`);

    let res = await executeQuery("SELECT sd_avg, sq_avg, st_avg, sp_avg FROM (SELECT AVG(studying) AS st_avg, AVG(sports) AS sp_avg FROM evening WHERE date >= $1 AND date <= $2 AND user_id = $3) AS e, (SELECT AVG(sleep_duration) AS sd_avg, AVG(sleep_quality) AS sq_avg FROM morning WHERE date >= $1 AND date <= $2 AND user_id = $3) AS m", date1, date2, Number(user_id));
    res = res.rowsOfObjects()[0];
    res.sd_avg = Math.round(res.sd_avg * 100) / 100;
    res.sq_avg = Math.round(res.sq_avg * 100) / 100;
    res.sp_avg = Math.round(res.sp_avg * 100) / 100;
    res.st_avg = Math.round(res.st_avg * 100) / 100;
    let m_avg = await executeQuery("WITH T2 AS (SELECT mood FROM evening WHERE date >= $1 AND date <= $2 AND user_id = $3 UNION ALL SELECT mood FROM morning WHERE date >= $1 AND date <= $2 AND user_id = $3) SELECT AVG(mood) FROM T2;", date1, date2, Number(user_id));
    m_avg = m_avg.rowsOfObjects()[0];
    res.m_avg = m_avg.avg;
    res.m_avg = Math.round(res.m_avg * 100) / 100;
    res.date1 = date1;
    res.date2 = date2;
    return res;   
}

const avgMood = async(date, id) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    const d = `${year}-${month}-${day}`;
    
    let res = await executeQuery("SELECT AVG(mood) FROM (SELECT mood FROM evening WHERE user_id = $1 AND date = $2 UNION SELECT mood FROM morning WHERE user_id = $1 AND date = $2) AS T;", id, date);
    if (res.rowCount > 0) {
        res = res.rowsOfObjects()[0];
        return res.avg;
    } else {
        return 0;
    }
}

const logEvening = async(username, date, sports, studying, regularity, quality, mood) => {
    let id = await executeQuery("SELECT id FROM users WHERE username = $1;",username);
    id = id.rowsOfObjects()[0].id;
    const done_already = await executeQuery("SELECT * FROM evening WHERE user_id = $1 AND date = $2;", id, date);
    if (done_already.rowCount > 0 ) { // The report has been done once today, delete the old one
        await executeQuery("DELETE FROM evening WHERE user_id = $1 AND date = $2;", id, date);
    }

    await executeQuery("INSERT INTO evening (user_id, date, sports, studying, regularity, quality, mood) VALUES ($1, $2, $3, $4, $5, $6, $7);", id, date, sports, studying, regularity, quality, mood);
    
}

const doneToday = async(date, id, time) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    const today = `${year}-${month}-${day}`;
    const res = await executeQuery(`SELECT * FROM ${time} WHERE user_id = $1 AND date = $2;`,id,today);
    if(res.rowCount > 0) {
        return true;
    } else {
        return false;
    }
}

const getApiWeekSummary = async(date = new Date()) => {
    
    let year2 = date.getFullYear();
    let month2 = date.getMonth() + 1;
    let day2 = date.getDate();
    const date2 = `${year2}-${month2}-${day2}`;

    date.setDate(date.getDate() - 7);
    let year1 = date.getFullYear();
    let month1 = date.getMonth() + 1;
    let day1 = date.getDate() + 1;
    const date1 = `${year1}-${month1}-${day1}`;

    // console.log(`date1: ${date1}\ndate2: ${date2}\nuser_id: ${user_id}`);

    let res = await executeQuery("SELECT sd_avg, sq_avg, st_avg, sp_avg FROM (SELECT AVG(studying) AS st_avg, AVG(sports) AS sp_avg FROM evening WHERE date >= $1 AND date <= $2 ) AS e, (SELECT AVG(sleep_duration) AS sd_avg, AVG(sleep_quality) AS sq_avg FROM morning WHERE date >= $1 AND date <= $2 ) AS m", date1, date2);
    res = res.rowsOfObjects()[0];
    res.sd_avg = Math.round(res.sd_avg * 100) / 100;
    res.sq_avg = Math.round(res.sq_avg * 100) / 100;
    res.sp_avg = Math.round(res.sp_avg * 100) / 100;
    res.st_avg = Math.round(res.st_avg * 100) / 100;
    let m_avg = await executeQuery("WITH T2 AS (SELECT mood FROM evening WHERE date >= $1 AND date <= $2  UNION ALL SELECT mood FROM morning WHERE date >= $1 AND date <= $2 ) SELECT AVG(mood) FROM T2;", date1, date2);
    m_avg = m_avg.rowsOfObjects()[0];
    res.m_avg = m_avg.avg;
    res.m_avg = Math.round(res.m_avg * 100) / 100;
    res.date1 = date1;
    res.date2 = date2;
    return res;   
}

const getApiDaySummary = async(date = new Date()) => {
    
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    const d = `${year}-${month}-${day}`;

    let res = await executeQuery("SELECT sd_avg, sq_avg, st_avg, sp_avg FROM (SELECT AVG(studying) AS st_avg, AVG(sports) AS sp_avg FROM evening WHERE date = $1 ) AS e, (SELECT AVG(sleep_duration) AS sd_avg, AVG(sleep_quality) AS sq_avg FROM morning WHERE date = $1 ) AS m", d);
    res = res.rowsOfObjects()[0];
    res.sd_avg = Math.round(res.sd_avg * 100) / 100;
    res.sq_avg = Math.round(res.sq_avg * 100) / 100;
    res.sp_avg = Math.round(res.sp_avg * 100) / 100;
    res.st_avg = Math.round(res.st_avg * 100) / 100;
    let m_avg = await executeQuery("WITH T2 AS (SELECT mood FROM evening WHERE date = $1  UNION ALL SELECT mood FROM morning WHERE date = $1 ) SELECT AVG(mood) FROM T2;", d);
    m_avg = m_avg.rowsOfObjects()[0];
    res.m_avg = m_avg.avg;
    res.m_avg = Math.round(res.m_avg * 100) / 100;
    res.date = d;
    return res;   
}


export { getHello, setHello, authenticate, register, logMorning, getWeekSummary, getMonthSummary, avgMood, logEvening, doneToday, getApiWeekSummary, getApiDaySummary };
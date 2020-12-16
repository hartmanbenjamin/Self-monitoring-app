import { executeQuery } from "../../database/database.js";
import { getHello, authenticate, register, logMorning, getWeekSummary, avgMood, logEvening, getMonthSummary, doneToday } from "../../services/services.js";

const hello = async({render, session}) => {
  const isAuth = await session.get('authorized');
  const data = {
    auth: isAuth
  };
  render("welcome.ejs", data);
};

const handleLogin = async({ request, session, response, render}) => {
    const body = request.body();
    const value = await body.value;
    const username = value.get('username');
    const password = value.get('password');
    const data = await authenticate(username, password)
    if (!data.username) {
      session.set('authorized', true);
      session.set('username', username);
      let id = await executeQuery("SELECT id FROM users WHERE username = $1;",username);
      id = id.rowsOfObjects()[0].id;
      session.set('id', id);

      response.status = 200;
      response.redirect('/behavior/reporting');
    } else {
      render('login.ejs', data);
    }
    
}

const showLogin = ({render}, ) => {
  render('login.ejs', {username : false, wrongpass: false});
}

const showRegister = ({render}) => {
  render('register.ejs', {isFree: true, email: false});
}

const showMorning = async({render, session, response}) => {
  const isAuth = await session.get('authorized');
  const d = new Date();
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  if(month < 10 ) {
    month = `0${month}`;
  }
  let day = d.getDate();
  if (day < 10) {
    day = `0${day}`;

  }
  const date = `${year}-${month}-${day}`;
  const data = {
    date: date
  };
  if(isAuth) {
    render('report-morning.ejs', data);
  } else {
    response.redirect('/auth/login');
  }
}
 
const handleRegister = async({ request, response, render}) => {
  const body = request.body();
  const value = await body.value;
  const username = value.get('username');
  const password = value.get('password');
  const isFree = await register(username, password);
  
  if (!isFree) {
    // Another user has that username
    render('register.ejs', {isFree: false, email: username})
  } else {
    render('success.ejs', {email: username});
  }
}

const main = async({response, session, render}) => {
  const authed = await session.get('authorized');
  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (authed) {
    const id = await session.get('id');
    let data = {
      username: await session.get('username'),
      avg_today: await avgMood(today, id),
      avg_yesterday: await avgMood(yesterday, id),
      morning: await doneToday(today, id, 'morning'),
      evening: await doneToday(today, id, 'evening')
    };
    
    data.avg_today = Math.round(data.avg_today * 100) / 100;
    data.avg_yesterday = Math.round(data.avg_yesterday * 100) / 100;
    // console.log(data);
    render('main.ejs', data);
  } else {
    response.redirect('/auth/login');
  }
  
}

const reportMorning = async({ response, session, request }) => {
  const username = await session.get('username');
  const body = request.body();
  const value = await body.value;
  const sleep_duration = value.get('sleep_duration');
  const sleep_quality = value.get('sleep_quality');
  const mood = value.get('mood')
  const date = value.get('date');
  
  await logMorning(username, date, sleep_duration, sleep_quality, mood);
  response.redirect('/behavior/reporting');
}

const showSummary = async({render, session}) => {
  const date = new Date();
  const user_id = await session.get('id');
  const avgs = await getWeekSummary(user_id, date);
  render('summary.ejs', avgs);
}

const showEvening = async({render, session, response}) => {
  const isAuth = await session.get('authorized');
  const d = new Date();
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  if(month < 10 ) {
    month = `0${month}`;
  }
  let day = d.getDate();
  if (day < 10) {
    day = `0${day}`;
  }
  const date = `${year}-${month}-${day}`;
  const data = {
    date: date
  };
  if(isAuth) {
    render('report-evening.ejs', data);
  } else {
    response.redirect('/auth/login');
  }
}

const reportEvening = async({session, response, request}) => {
  const username = await session.get('username');
  const body = request.body();
  const value = await body.value;
  const sports = value.get('sports');
  const studying = value.get('studying');
  const regularity = value.get('regularity');
  const quality = value.get('quality');
  const mood = value.get('mood')
  const date = value.get('date');
  
  await logEvening(username, date, sports, studying, regularity, quality, mood);
  response.redirect('/behavior/reporting');
}

const refreshSummary = async({render, request, response, session}) => {
  const user_id = await session.get('id');
  const body = request.body();
  const value = await body.value;
  let week = value.get('week');
  let month = value.get('month');
  let date, date2, year;
  if (month === null && week !== null) { // refresh week
    year = Number(week.slice(0,4));
    week = Number(week.slice(6,8));

    const first = new Date(year, 0, 1 + (week - 1) * 7);
    const weekday = first.getDay();
    date = first;
    if (weekday <= 4)
        date.setDate(first.getDate() - first.getDay() + 1);
    else
        date.setDate(first.getDate() + 8 - first.getDay());
    date.setDate(date.getDate() + 6);
    const avgs = await getWeekSummary(user_id, date);
    render('summary.ejs', avgs);

  } else if (week === null && month !== null) { // refresh month
    year = Number(month.slice(0,4));
    month = Number(month.slice(5,7));
    date = new Date(year, Number(month) , 1);
    const avgs = await getMonthSummary(user_id, date);
    render('summary.ejs', avgs);
  }

}

const logOut = ({response, session}) => {
  session.set('authorized', false);
  session.set('username', null);
  session.set('id', null);
  // console.log('moine');
  response.redirect('/auth/login');
}


export { hello, showLogin, handleLogin, showRegister, handleRegister, main, showMorning, reportMorning, showSummary, showEvening, reportEvening, refreshSummary, logOut };
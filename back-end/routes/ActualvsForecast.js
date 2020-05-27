const express = require('express')
const router = express.Router()
const connection = require('../server').connection;
const { checkForResources } = require('../utils/resources');
const { useAPIResource } = require('../utils/resources');
const { resetQuota } = require('../utils/resources');
const { sendData } = require('../utils/response');
const { deleteFile } = require('../utils/deletefile');
const { isAuthenticated } = require('../middlewares/auth');

//get data on server date
router.get('/:areaName/:resolution/date/', isAuthenticated, resetQuota, checkForResources, (req, res) => {
  let date = new Date();
  connection.query("SELECT Id FROM resolutioncode WHERE ResolutionCodeText = '" + req.params.resolution + "'", function (err, result, fields) {
    if (result.length == 0 || result == undefined) {
      res.sendStatus(400);
      deleteFile();
      return;
    }
    let resCode = result[0].Id;
    connection.query("SELECT a.*, b.AreaTypeCodeText, c.MapCodeText, d.ResolutionCodeText FROM dayaheadtotalloadforecast a join areatypecode b on a.AreaTypeCodeId = b.Id join mapcode c on a.MapCodeId = c.Id join resolutioncode d on a.ResolutionCodeId = d.Id, dayaheadtotalloadforecast e WHERE a.AreaName = '" + req.params.areaName + "' AND a.ResolutionCodeId = '" + result[0].Id +
    "' AND a.Year = '" + date.getFullYear() + "' AND a.Month = '" + date.getMonth() + 1 + "' AND a.Day = '" + date.getDate() + "' ORDER BY a.DateTime ASC", function (err, result, fields) {
      if (err) throw err;
      let data = [];
      if (result.length == 0 || result == undefined) {
        sendData(req, res, null);
        deleteFile();
        return;
      }
      else {
        for (var x in result) {
          data.push({ "Source" : "entso-e", "Dataset" : "ActualVSForecastedTotalLoad", "AreaName" : result[x].AreaName, "AreaTypeCode" : result[x].AreaTypeCodeText, "MapCode" : result[x].MapCodeText,
          "ResolutionCode" : result[x].ResolutionCodeText, "Year" : result[x].Year, "Month" : result[x].Month, "Day" : result[x].Day, "DateTimeUTC" : result[x].DateTime,
          "DayAheadTotalLoadForecastValue" : result[x].TotalLoadValue });
        }
        connection.query("SELECT TotalLoadValue FROM actualtotalload WHERE AreaName = '" + req.params.areaName + "' AND ResolutionCodeId = '" + resCode +
        "' AND Year = '" + date.getFullYear() + "' AND Month = '" + date.getMonth() + "' AND Day = '" + date.getDay() + "' ORDER BY DateTime ASC", function (err, result, fields) {
          for (var x in result) {
            data[x]["ActualTotalLoadValue"] = result[x].TotalLoadValue;
          }
          sendData(req, res, data);
        });
      }
      useAPIResource(JSON.parse(localStorage.getItem('authUser'))['username']);
    });
  });
});

//get data on given date
router.get('/:areaName/:resolution/date/:date/', isAuthenticated, resetQuota, checkForResources, (req, res) => {
  let date = req.params.date.split('-');
  if (date.length != 3) res.sendStatus(400)
  else {
    let year = date[0];
    let month = date[1];
    let day = date[2];
    connection.query("SELECT Id FROM resolutioncode WHERE ResolutionCodeText = '" + req.params.resolution + "'", function (err, result, fields) {
      if (result.length == 0 || result == undefined) {
        res.sendStatus(400);
        deleteFile();
        return;
      }
      let resCode = result[0].Id;
      connection.query("SELECT a.*, b.AreaTypeCodeText, c.MapCodeText, d.ResolutionCodeText FROM dayaheadtotalloadforecast a join areatypecode b on a.AreaTypeCodeId = b.Id join mapcode c on a.MapCodeId = c.Id join resolutioncode d on a.ResolutionCodeId = d.Id WHERE a.AreaName = '" + req.params.areaName + "' AND a.ResolutionCodeId = '" + result[0].Id +
      "' AND a.Year = '" + year + "' AND a.Month = '" + month + "' AND a.Day = '" + day + "' ORDER BY a.DateTime ASC", function (err, result, fields) {
        if (err) throw err;
        let data = [];
        if (result.length == 0 || result == undefined) {
          sendData(req, res, null);
          deleteFile();
          return;
        }
        else {
          for (var x in result) {
            data.push({ "Source" : "entso-e", "Dataset" : "ActualVSForecastedTotalLoad", "AreaName" : result[x].AreaName, "AreaTypeCode" : result[x].AreaTypeCodeText, "MapCode" : result[x].MapCodeText,
            "ResolutionCode" : result[x].ResolutionCodeText, "Year" : result[x].Year, "Month" : result[x].Month, "Day" : result[x].Day, "DateTimeUTC" : result[x].DateTime,
            "DayAheadTotalLoadForecastValue" : result[x].TotalLoadValue });
          }
          connection.query("SELECT TotalLoadValue FROM actualtotalload WHERE AreaName = '" + req.params.areaName + "' AND ResolutionCodeId = '" + resCode +
          "' AND Year = '" + year + "' AND Month = '" + month + "' AND Day = '" + day + "' ORDER BY DateTime ASC", function (err, result, fields) {
            for (var x in result) {
              data[x]["ActualTotalLoadValue"] = result[x].TotalLoadValue;
            }
            sendData(req, res, data);
          });
        }
        useAPIResource(JSON.parse(localStorage.getItem('authUser'))['username']);
      });
    });
  }
});

//get data per day
router.get('/:areaName/:resolution/month/:date/', isAuthenticated, resetQuota, checkForResources, (req, res) => {
  let date = req.params.date.split('-');
  if (date.length != 2) res.sendStatus(400);
  else {
    let year = date[0];
    let month = date[1];
    connection.query("SELECT Id FROM resolutioncode WHERE ResolutionCodeText = '" + req.params.resolution + "'", function (err, result, fields) {
      if (result.length == 0 || result == undefined) {
        res.sendStatus(400);
        deleteFile();
        return;
      }
      let resCode = result[0].Id;
      connection.query("SELECT a.*, SUM(a.TotalLoadValue) as sumPerDayF, b.AreaTypeCodeText, c.MapCodeText, d.ResolutionCodeText FROM dayaheadtotalloadforecast a join areatypecode b on a.AreaTypeCodeId = b.Id join mapcode c on a.MapCodeId = c.Id join resolutioncode d on a.ResolutionCodeId = d.Id WHERE a.AreaName = '" + req.params.areaName + "' AND a.ResolutionCodeId = '" + result[0].Id +
      "' AND a.Year = '" + year + "' AND a.Month = '" + month + "' GROUP BY a.Day ORDER BY a.DateTime ASC", function (err, result, fields) {
        if (err) throw err;
        let data = [];
        if (result.length == 0 || result == undefined) {
          sendData(req, res, null);
          deleteFile();
          return;
        }
        else {
          for (var x in result) {
            data.push({ "Source" : "entso-e", "Dataset" : "ActualVSForecastedTotalLoad", "AreaName" : result[x].AreaName, "AreaTypeCode" : result[x].AreaTypeCodeText, "MapCode" : result[x].MapCodeText,
            "ResolutionCode" : result[x].ResolutionCodeText, "Year" : result[x].Year, "Month" : result[x].Month, "Day" : result[x].Day, "DayAheadTotalLoadForecastByDayValue" : result[x].sumPerDayF });
          }
          connection.query("SELECT SUM(TotalLoadValue) as sumPerDay FROM actualtotalload WHERE AreaName = '" + req.params.areaName + "' AND ResolutionCodeId = '" + resCode +
          "' AND Year = '" + year + "' AND Month = '" + month + "' GROUP BY Day ORDER BY DateTime ASC", function (err, result, fields) {
            for (var x in result) {
              data[x]["ActualTotalLoadByDayValue"] = result[x].sumPerDay;
            }
            sendData(req, res, data);
          });
        }
        useAPIResource(JSON.parse(localStorage.getItem('authUser'))['username']);
      });
    });
  }
});

//get data per month
router.get('/:areaName/:resolution/year/:date/', isAuthenticated, resetQuota, checkForResources, (req, res) => {
  let date = req.params.date.split('-');
  if (date.length != 1) res.sendStatus(400);
  else {
    let year = req.params.date;
    connection.query("SELECT Id FROM resolutioncode WHERE ResolutionCodeText = '" + req.params.resolution + "'", function (err, result, fields) {
      if (result.length == 0 || result == undefined) {
        res.sendStatus(400);
        deleteFile();
        return;
      }
      let resCode = result[0].Id;
      connection.query("SELECT a.*, SUM(a.TotalLoadValue) as sumPerMonthF, b.AreaTypeCodeText, c.MapCodeText, d.ResolutionCodeText FROM dayaheadtotalloadforecast a join areatypecode b on a.AreaTypeCodeId = b.Id join mapcode c on a.MapCodeId = c.Id join resolutioncode d on a.ResolutionCodeId = d.Id WHERE a.AreaName = '" + req.params.areaName + "' AND a.ResolutionCodeId = '" + result[0].Id +
      "' AND a.Year = '" + year + "' GROUP BY a.Month ORDER BY a.DateTime ASC", function (err, result, fields) {
        if (err) throw err;
        let data = [];
        if (result.length == 0 || result == undefined) {
          sendData(req, res, null);
          deleteFile();
          return;
        }
        else {
          for (var x in result) {
            data.push({ "Source" : "entso-e", "Dataset" : "ActualVSForecastedTotalLoad", "AreaName" : result[x].AreaName, "AreaTypeCode" : result[x].AreaTypeCodeText, "MapCode" : result[x].MapCodeText,
            "ResolutionCode" : result[x].ResolutionCodeText, "Year" : result[x].Year, "Month" : result[x].Month, "DayAheadTotalLoadForecastByMonthValue" : result[x].sumPerMonthF });
          }
          connection.query("SELECT SUM(TotalLoadValue) as sumPerMonth FROM actualtotalload WHERE AreaName = '" + req.params.areaName + "' AND ResolutionCodeId = '" + resCode +
          "' AND Year = '" + year + "' GROUP BY Month ORDER BY DateTime ASC", function (err, result, fields) {
            for (var x in result) {
              data[x]["ActualTotalLoadByMonthValue"] = result[x].sumPerMonth;
            }
            sendData(req, res, data);
          });
        }
        useAPIResource(JSON.parse(localStorage.getItem('authUser'))['username']);
      });
    });
  }
});

//bad requests
router.get('/*', isAuthenticated, resetQuota, checkForResources, (req, res, next) => {
  res.sendStatus(400);
});

module.exports = router

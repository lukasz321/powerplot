import React, { Fragment, useState, useEffect } from "react";

/*
import {
  faBars,
  faCheck,
  faCircleChevronDown,
  faCircleChevronUp,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
*/

import "./App.css";
import styles from "styles";

import { monthNames } from "lib/constants";
import { displayDate, calculateMean, numHoursToTimeString } from "lib/utils";
import { PowerData, PowerDataItem } from "lib/types";

import Placeholder from "components/placeholder";
//import InfoBox from "components/info-box";
//import Insight from "components/insight";

import DailyLineChart from "components/daily-line-chart";
import HourlyBarChart from "components/hourly-bar-chart";
import MonthlyBarChart from "components/monthly-bar-chart";
import BillBreakdownPieChart from "components/bill-breakdown-pie-chart";

//TODO: calculate time of use vs regular pricing
// https://www.coned.com/en/accounts-billing/your-bill/time-of-use

//https://recharts.org/en-US/examples/AreaChartFillByValue
// maybe make a moving average akin to a dynamic gas measurer in a Subaru
// maybe the line chart could be:
// stacked bars for day times but
// when "compare to others checked, show lines instea"
// and when "show progress/momentum" show the 3rd chart: Subaru gas chart

// In hourly, show a straight line this month's average? or last's?

async function fetchData() {
  try {
    let apiUrl = "http://0.0.0.0:8181/";

    if (window.location.hostname.includes("power.lzagaja.com")) {
      apiUrl =
        "https://s3sync-public.s3.amazonaws.com/powerplot.json?v=" +
        new Date().getTime(); // so that the browser doesn't cache anything
    } else if (process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS) {
      // when run locally, fetch from a server expected to run on the same machine
      apiUrl = `http://${process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS}:8181/`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else if (contentType && contentType.includes("binary/octet-stream")) {
      // fetching the data from s3
      const jsonString = await response.text();
      const data = JSON.parse(jsonString);
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error("There was a problem fetching the data!");
    console.error(error);
    return null;
  }
}

const App: React.FC = () => {
  const [data, setData] = useState<PowerData | null>(null);

  // This is the month user sleects in MonthlyBarChart by clicking on a bar
  // undefined - signals to "set up the default", whatever that is, whereas null
  // indicates that user explicitly deselected all months (none are selected)
  const [selectedMonth, setSelectedMonth] = useState<undefined | null | string>(
    undefined,
  );

  // When use has the cursor above the MonthlyBarChart but no click (yet)
  const [highlightedMonth, setHighlightedMonth] = useState<null | string>(
    null,
  );

  // This is the data user selects in HourlyBarChart via a slider
  const [selectedBrushData, setSelectedBrushData] = useState<{
    average: number;
    width: number;
    firstIndexDate: Date;
    lastIndexDate: Date;
  }>({
    average: 0,
    width: 0,
    firstIndexDate: new Date(Date.now()),
    lastIndexDate: new Date(Date.now()),
  });

  useEffect(() => {
    // Fetch the data from s3 or local server on page load...
    fetchData()
      .then((data) => {
        if (data) {
          const powerData: PowerData = PowerData.deserialize(data);
          setData(powerData);
        }
      })
      .catch((error) => {
        console.error("Error during fetch!");
        console.error(error);
      });
  }, []);

  return (
    <div className="main">
      {/*
        <div
          style={{
            display: "inline-block",
            padding: "10px 0 0 40px",
          }}
        >
          {data && (
            <Insight
              text={`In the past 24 hours, the mean hourly usage has been ${
                data.hourlyTrend.past24H
              } kWh, which is ${data.hourlyTrend.pctDiff}% ${
                data.hourlyTrend.pctDiff <= 0 ? "lower" : "higher"
              } than the 7-day mean of ${data.hourlyTrend.past7D} kWh.`}
              leadingIcon={
                data.hourlyTrend.pctDiff <= 0
                  ? faCircleChevronUp
                  : faCircleChevronDown
              }
              sentiment={
                data.hourlyTrend.pctDiff <= 0 ? "positive" : "negative"
              }
            />
          )}
        </div>
      */}
      <div className="section">
        {data ? (
          <Fragment>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span>
                {`Between `}
                <span style={{ fontWeight: 300 }}>
                  {displayDate(selectedBrushData.firstIndexDate)}
                </span>
                {`, and `}
                <span style={{ fontWeight: 300 }}>
                  {displayDate(selectedBrushData.lastIndexDate)}
                </span>
                {` (approx. `}
                {numHoursToTimeString(selectedBrushData.width)}
                {`), the mean energy consumption was `}
              </span>
              <span style={{ display: "flex", alignItems: "center" }}>
                &nbsp; &nbsp;
                <span
                  style={{
                    fontSize: "1.3em",
                    fontWeight: 280,
                    color:
                      selectedBrushData.average < 0.3
                        ? styles.colorGreen
                        : selectedBrushData.average < 0.7
                        ? styles.colorYellow
                        : styles.colorRed,
                  }}
                >
                  {` ${selectedBrushData.average.toFixed(2)} kW `}
                </span>
                &nbsp; &nbsp;
                <span style={{ verticalAlign: "middle" }}>{`per hour.`}</span>
              </span>
            </div>

            <HourlyBarChart
              data={data.data.hourly}
              dataShown={(data: PowerDataItem[]) => {
                setSelectedBrushData({
                  average: calculateMean(data.map((d) => d.value)),
                  width: data.length,
                  firstIndexDate: data[0].date,
                  lastIndexDate: data[data.length - 1].date,
                });
              }}
            />
          </Fragment>
        ) : (
          <Placeholder />
        )}
      </div>

      <div className="section">
        {data ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <label style={{ fontSize: "54px", whiteSpace: "nowrap" }}>
                {`Projected ${
                  monthNames[
                    data.data.monthly[data.data.monthly.length - 1].month
                  ]
                } bill is`}
              </label>
            </div>

            {/* there needs to be a better way of doing this...*/}
            <div
              style={{
                marginLeft: "-260px",
                marginRight: "-80px",
                width: "700px",
              }}
            >
              <BillBreakdownPieChart
                projectedBillDollars={data.billing.projectedBillDollars}
                billBreakdown={data.billing.billBreakdown}
              />
            </div>
          </div>
        ) : (
          <Placeholder />
        )}
      </div>

      <div className="section">
        {data ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80% 20%",
              padding: "15px",
              gap: "15px",
            }}
          >
            <DailyLineChart
              data={data.data.daily}
              selectedMonth={selectedMonth}
              highlightedMonth={highlightedMonth}
            />
            <MonthlyBarChart // TODO: show monthly bars only if there are months to compare...
              data={data.data.monthly}
              onSelectedMonthChanged={(selectedMonth) =>
                setSelectedMonth(selectedMonth)
              }
              onHighlightedMonthChanged={(highlightedMonth) =>
                setHighlightedMonth(highlightedMonth)
              }
            />
          </div>
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};

export default App;
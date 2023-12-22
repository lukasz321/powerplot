import React, { useCallback, useState, useEffect } from "react";

import "./App.css";

import { CircularProgress, Backdrop } from "@mui/material";

import { monthNames } from "lib/constants";
import { calculateMean } from "lib/utils";
import { PowerData, PowerDataItem, BrushData } from "lib/types";
import { fetchData } from "lib/api";

import AppBar from "components/app-bar";
import BrushDataSentenceSummary from "components/brush-data-sentence-summary";
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

const Section: React.FC = (props) => {
    return (
    <div>
    </div>

    );
};

const App: React.FC = () => {
  const [data, setData] = useState<PowerData | null>(null);

  // This is the month user sleects in MonthlyBarChart by clicking on a bar
  // undefined - signals to "set up the default", whatever that is, whereas null
  // indicates that user explicitly deselected all months (none are selected)
  const [selectedMonth, setSelectedMonth] = useState<undefined | null | string>(
    undefined,
  );

  // When use has the cursor above the MonthlyBarChart but no click (yet)
  const [highlightedMonth, setHighlightedMonth] = useState<null | string>(null);

  // This is the data user selects in HourlyBarChart via a slider
  const [selectedBrushData, setSelectedBrushData] = useState<BrushData>({
    average: 0,
    width: 0,
    firstIndexDate: new Date(Date.now()),
    lastIndexDate: new Date(Date.now()),
  });

  // When brush width/range changes, updated the selectedBrushData state
  // for the sentence summary component to update...
  const handleOnBrushChange = useCallback((data: PowerDataItem[]) => {
    setSelectedBrushData({
      // Remove empty values from brush average (due to outages, etc)
      average: calculateMean(data.map((d) => d.value).filter((v) => v > 0)), 
      width: data.length,
      firstIndexDate: data[0].date,
      lastIndexDate: data[data.length - 1].date,
    });
  }, []);

  // Fetch data on page load...
  useEffect(() => {
    fetchData()
      .then((data) => {
        if (data) {
          const powerData: PowerData = PowerData.deserialize(data);
          setData(powerData);
        }
      })
      .catch((error) => {
        console.error("Error during fetch! See details below.");
        console.error(error);
      });
  }, []);

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowWidth < 768 ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "2em",
        paddingLeft: "2em",
        paddingRight: "2em",
      }}
    >
      Mobile is not supported, visit me on desktop!
    </div>
  ) : data ? (
    <div className="main">
      <AppBar data={data} />

      <div className="section">
        <BrushDataSentenceSummary selectedBrushData={selectedBrushData} />

        <HourlyBarChart
          data={data.data.hourly}
          dataShown={handleOnBrushChange}
        />
      </div>

      <div className="section transparent">
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
              transform: "translateX(17%)",
            }}
          >
            <span
              style={{
                fontSize: "54px",
                whiteSpace: "nowrap",
              }}
            >
              {`Projected ${
                monthNames[
                  data.data.monthly[data.data.monthly.length - 1].month
                ]
              } bill is`}
            </span>
          </div>

          <div
            style={{
              transform: `translateX(-17%)`,
              marginLeft: `${
                data.billing.projectedBillDollars < 100 ? "0px" : "20px"
              }`,
            }}
          >
            <BillBreakdownPieChart
              projectedBillDollars={data.billing.projectedBillDollars}
              billBreakdown={data.billing.billBreakdown}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="month-panel">
          <DailyLineChart
            data={data.data.daily}
            selectedMonth={selectedMonth}
            highlightedMonth={highlightedMonth}
          />
          <MonthlyBarChart // TODO: show monthly lines only if there are months to compare...
            data={data.data.monthly}
            projectedBillKWH={data.billing.projectedBillKWH}
            onSelectedMonthChanged={(selectedMonth) =>
              setSelectedMonth(selectedMonth)
            }
            onHighlightedMonthChanged={(highlightedMonth) =>
              setHighlightedMonth(highlightedMonth)
            }
          />
        </div>
      </div>
    </div>
  ) : (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={true}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default App;

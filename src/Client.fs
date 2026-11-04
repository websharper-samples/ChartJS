namespace Samples

open WebSharper
open WebSharper.JavaScript
open WebSharper.ChartJs
open WebSharper.UI
open WebSharper.UI.Html
open WebSharper.UI.Templating
open WebSharper.UI.Client

/// A small dashboard of Chart.js charts, built with WebSharper.ChartJs.
[<JavaScript>]
module Client =

    type Template = Templating.Template<"wwwroot/index.html", ClientLoad.FromDocument>

    /// Charts fill their container rather than a fixed canvas size.
    let private options () =
        let o = Options()
        o.Responsive <- true
        o.MaintainAspectRatio <- false
        o

    let private render (data: ChartData) =
        canvas [
            attr.``class`` "chart-canvas"
            on.afterRender (fun element ->
                Chart(element, ChartCreate(data, options())) |> ignore)
        ] []

    let private lineChart () =
        let random = System.Random()
        let labels = [| for i in 1 .. 7 -> sprintf "Jan %d, 2015" i |]
        let values = [| for _ in labels -> random.NextDouble() * 100.0 |]
        let data = ChartData()
        data.Datasets <-
            [|
                LineChartDataSet(
                    Label = "Amount",
                    BackgroundColor = "#dbeafe",
                    BorderColor = "#3b82f6",
                    Data = values) :> ADataSet
            |]
        data.Labels <- labels
        render data

    let private barChart () =
        let labels = [| "Sandor"; "Loic"; "Istvan"; "Andras" |]
        let values = [| 20.0; 25.0; 21.0; 29.0 |]
        let data = ChartData()
        data.Datasets <-
            [|
                BarChartDataSet(
                    Label = "Age",
                    BackgroundColor = "#c7d2fe",
                    BorderColor = "#6366f1",
                    Data = values) :> ADataSet
            |]
        data.Labels <- labels
        render data

    let private radarChart () =
        let labels =
            [| "Eating"; "Drinking"; "Sleeping"; "Designing"; "Coding"; "Cycling"; "Running" |]
        let data = ChartData()
        data.Datasets <-
            [|
                RadarChartDataSet(
                    Label = "Alice",
                    BackgroundColor = "rgba(99, 102, 241, 0.2)",
                    BorderColor = "rgba(99, 102, 241, 1)",
                    Data = [| 28.0; 48.0; 40.0; 19.0; 96.0; 27.0; 100.0 |]) :> ADataSet
                RadarChartDataSet(
                    Label = "Bob",
                    BackgroundColor = "rgba(14, 165, 233, 0.2)",
                    BorderColor = "rgba(14, 165, 233, 1)",
                    Data = [| 65.0; 59.0; 90.0; 81.0; 56.0; 55.0; 40.0 |]) :> ADataSet
            |]
        data.Labels <- labels
        render data

    [<SPAEntryPoint>]
    let Main () =
        Template()
            .LineChart(lineChart ())
            .BarChart(barChart ())
            .RadarChart(radarChart ())
            .Bind()

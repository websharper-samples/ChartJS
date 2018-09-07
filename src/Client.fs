namespace Samples

open WebSharper
open WebSharper.ChartJs
open WebSharper.JavaScript
open WebSharper.UI
open WebSharper.UI.Html
open WebSharper.UI.Client

[<JavaScript>]
module ChartJs =
    type Expense =
        {
            Date: string
            Amount: float
        }

    type Employee =
        {
            Name: string
            Age: int
        }

    let GetAllExpenses () =
        let fate = System.Random()
        seq {
            for index in [1 .. 7] do
            yield { Date   = "Jan " + string index + ", 2015"
                    Amount = fate.NextDouble() * 100.0 }
        }
        |> Seq.toArray
        |> async.Return

    let GetAllEmployees () =
        [|
            { Name = "Sandor"; Age = 20 }
            { Name = "Loic";   Age = 25 }
            { Name = "Istvan"; Age = 21 }
            { Name = "Andras"; Age = 29 }
        |]
        |> async.Return

    [<Inline "$0.getContext(\"2d\")">]
    let getContext (canvas : Dom.Node) = X<CanvasRenderingContext2D>

    let LineChart =
        div [] [
            h3 [] [text "My expenses as a line chart (in US dollars)"]
            canvas [
                attr.width  "450"
                attr.height "300"
                on.afterRender (fun canvas ->
                    async {
                        let context = getContext canvas
                        let! expenses = GetAllExpenses ()
                        let (labels, data) =
                            expenses
                            |> Array.map (fun expense -> expense.Date, float (expense.Amount.JS.ToFixed 2))
                            |> Array.unzip
                        let cd =
                            ChartData(
                                [|
                                    LineChartDataSet(
                                        BackgroundColor  = "#d6e8f6",
                                        PointBackgroundColor = Union1Of2 "#b0c4de",
                                        Data       = data
                                    )
                                |]
                            )
                        cd.Labels <- labels
                        let ccc = CommonChartConfig()
                        let cc = ChartCreate("line", cd, ccc)
                        Chart(context.Canvas, cc)
                        |> ignore
                    }
                    |> Async.Start
                )
            ] []
        ]

    let BarChart =
        div [] [
            h3 [] [text "Employees and their ages"]
            canvas [
                attr.width  "450"
                attr.height "300"
                on.afterRender (fun canvas ->
                    async {
                        let context = getContext canvas
                        let! employees = GetAllEmployees ()
                        let (labels, data) =
                            employees
                            |> Array.map (fun employee -> employee.Name, float employee.Age)
                            |> Array.unzip
                        let x = 
                            ChartData(
                                [|
                                    BarChartDataSet(
                                        BackgroundColor = "#d6e8f6",
                                        Data      = data
                                    )
                                |]
                            )
                        x.Labels <- labels
                        let ccc = CommonChartConfig()
                        let cc = ChartCreate("bar", x, ccc)
                        Chart(context.Canvas, cc)
                        |> ignore
                    }
                    |> Async.Start
                )
            ] []
        ]
    
    let RadarChart =
        div [] [
            h3 [] [text "Advanced usage (radar chart)"]
            canvas [
                attr.width  "450"
                attr.height "300"
                on.afterRender (fun canvas ->
                    let context = getContext canvas
                    let x =
                        ChartData(
                            [|
                                RadarChartDataSet(
                                    BackgroundColor   = "rgba(151, 187, 205, 0.2)",
                                    BorderColor = "rgba(151, 187, 205, 1)",
                                    PointBackgroundColor  = Union1Of2 "rgba(151, 187, 205, 1)",
                                    Data        = [|28.0; 48.0; 40.0; 19.0; 96.0; 27.0; 100.0|]
                                )
                                RadarChartDataSet(
                                    BackgroundColor   = "rgba(220, 220, 220, 0.2)",
                                    BorderColor = "rgba(220, 220, 220, 1)",
                                    PointBackgroundColor  = Union1Of2 "rgba(220,220,220,1)",
                                    Data        = [|65.0; 59.0; 90.0; 81.0; 56.0; 55.0; 40.0|]
                                )
                            |]
                        )
                    x.Labels <-
                        [|"Eating"; "Drinking"; "Sleeping"; "Designing"; "Coding"; "Cycling"; "Running"|]
                    let ccc = CommonChartConfig()
                    let cc = ChartCreate("radar",x, CommonChartConfig())
                    Chart(context.Canvas, cc)
                    |> ignore
                )
            ] []
        ]

    [<SPAEntryPoint>]
    let Main =
        div [] [
            LineChart
            BarChart
            RadarChart
        ]
        |> Doc.RunById "main"

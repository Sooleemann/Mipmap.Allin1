import Map from "/lib/@arcgis/core/Map.js";
import SceneView from "/lib/@arcgis/core/views/SceneView.js";
import CoordinateConversion from "/lib/@arcgis/core/widgets/CoordinateConversion.js";
import Format from "/lib/@arcgis/core/widgets/CoordinateConversion/support/Format.js";
import Conversion from "/lib/@arcgis/core/widgets/CoordinateConversion/support/Conversion.js";
import * as intl from "/lib/@arcgis/core/intl.js";
import BasemapGallery from "/lib/@arcgis/core/widgets/BasemapGallery.js";
import DirectLineMeasurement3D from "/lib/@arcgis/core/widgets/DirectLineMeasurement3D.js";
import AreaMeasurement3D from "/lib/@arcgis/core/widgets/AreaMeasurement3D.js";
import ElevationProfile from "/lib/@arcgis/core/widgets/ElevationProfile.js";
import Daylight from "/lib/@arcgis/core/widgets/Daylight.js";
import Weather from "/lib/@arcgis/core/widgets/Weather.js";
import * as webMercatorUtils from "/lib/@arcgis/core/geometry/support/webMercatorUtils.js";
import FeatureLayer from "/lib/@arcgis/core/layers/FeatureLayer.js";
import Point from "/lib/@arcgis/core/geometry/Point.js";
import Camera from "/lib/@arcgis/core/Camera.js";
import * as reactiveUtils from "/lib/@arcgis/core/core/reactiveUtils.js";
import Editor from "/lib/@arcgis/core/widgets/Editor.js";
import Slice from "/lib/@arcgis/core/widgets/Slice.js";
import Legend from "/lib/@arcgis/core/widgets/Legend.js";
import Search from "/lib/@arcgis/core/widgets/Search.js";

let map, view, initialViewParams, homeCamera, activeWidget, points;

init();
function init() {//{heading: 15.305206383184679, tilt: 24.706372111039396, lat: 15.177715113787393, lon: 29.517314256175773, z: 4185299.7677175254}
    let lon = 29.517314256175773;
    let lat = 15.177715113787393;
    let z = 4185299.7677175254;
    let tilt = 24.706372111039396;
    let heading = 15.305206383184679;

    intl.setLocale("en");
    homeCamera = new Camera({
        tilt: tilt,
        heading: heading,
        position: {
            latitude: lat,
            longitude: lon,
            z: z,
            //spatialReference: { wkid: 4326 }
        },
    });

    map = new Map({
        basemap: "hybrid",//"dark-gray-vector",
        ground: "world-elevation"
    });

    initialViewParams = {
        container: "viewDiv",
        map: map,
        camera: new Camera({
            tilt: tilt,
            heading: heading,
            position: {
                latitude: lat,
                longitude: lon,
                z: z,
                //spatialReference: { wkid: 4326 }
            },
        }),
        environment: {
            atmosphere: {
                // creates a realistic view of the atmosphere
                quality: "high"
            },
            lighting: {
                type: 'virtual'
            }
        }
    };
    view = new SceneView(initialViewParams);
    view.watch("camera", updateIndicator);

    view.when(() => {
        reactiveUtils.when(
            () => view.stationary === true,
            () => {
                if (view.extent) {
                    //updateIndicator(camera)
                    showWeatherInPosition(view.camera.position);
                    setLocationUrl();

                }
            }
        );
        setLocationUrl();



    });

    AddLayers();

    initUI();


    addCoordinateTransformation();
}
function updateIndicator(camera) {

    console.log({ heading: camera.heading, tilt: camera.tilt, lat: camera.position.latitude, lon: camera.position.longitude, z: camera.position.z });

}

function setLocationUrl() {
    let c = view.camera;

    var hash = `#map=${c.position.latitude.toFixed(6)}/${c.position.longitude.toFixed(6)}/${c.position.z.toFixed(2)}/${c.tilt.toFixed(2)}/${c.heading.toFixed(2)}`;
    var state = {
        lat: c.position.latitude,
        lon: c.position.longitude,
        z: c.position.z,
        heading: c.heading,
        tilt: c.tilt,
    };
    window.history.pushState(state, 'map', hash);
}

function showWeatherInPosition(position) {
    var apiUrl = `/api/services/GetWeather?lat=${position.latitude}&lon=${position.longitude}&appid=24a2e78f8adf4546c65fb79457295726&lang=en&units=metric`;
    if (position.z < 150000 && $('#chkhava').is(":checked")) {

        // controller.abort();

        fetch(apiUrl, {
            method: 'get',
            //signal : signal,

        }).then((response) => {
            if (!response.ok) {
                $('#weatherBox').hide();
                return false;
            }
            return response.json();
        }).then(data => {
            if (data) {
                var wdata = JSON.parse(data.weather);
                var loc = JSON.parse(data.geoLocation);
                $('#weatherBox').show();
                let weatherHeader = document.querySelector('.weather-header');
                let weatherIcon = document.querySelector('.weather-image');
                let weatherValue = document.querySelector('.weather-value');
                let weatherDescription = document.querySelector('.weather-description');
                let basinc = document.querySelector('.basinc');
                let ruzgar = document.querySelector('.ruzgar');
                let nem = document.querySelector('.nem');
                weatherHeader.innerHTML = wdata.name;//loc[0].name;
                weatherIcon.src = '/images/weather/' + wdata.weather[0].icon + '.png';
                basinc.innerHTML = wdata.main.pressure + 'hPA';
                ruzgar.innerHTML = wdata.wind.speed + 'm/s';
                nem.innerHTML = '% ' + wdata.main.humidity;
                weatherDescription.innerHTML = wdata.weather[0].description;
                weatherValue.innerHTML = wdata.main.temp + '°';

                if (wdata.weather[0].icon == "01d" || wdata.weather[0].icon == "01n") {
                    view.environment.weather = {
                        type: "sunny",
                        cloudCover: 0.4
                    }
                }
                else if (wdata.weather[0].icon == "04d" || wdata.weather[0].icon == "04n") {
                    view.environment.weather = {
                        type: "cloudy",
                        cloudCover: 0.7
                    }
                }
                else if (wdata.weather[0].icon == "10d" || wdata.weather[0].icon == "10n") {
                    view.environment.weather = {
                        type: "rainy",
                        cloudCover: 0.8,
                        precipitation: 0.3
                    }
                }
                else if (wdata.weather[0].icon == "13d" || wdata.weather[0].icon == "13n") {
                    view.environment.weather = {
                        type: "snowy",
                        cloudCover: 0.5,
                        precipitation: 0.3,
                        snowCover: "enabled",
                    }
                }
                else if (wdata.weather[0].icon == "50d" || wdata.weather[0].icon == "50n") {
                    view.environment.weather = {
                        type: "foggy",
                        fogStrength: 0.4
                    }
                }

            }
            else
                $('#weatherBox').hide();

        }).catch(() => {
            $('#weatherBox').hide();

        });
    }
    else
        $('#weatherBox').hide();

}

function addCoordinateTransformation() {


    var ccWidget = new CoordinateConversion({
        view: view
    });
    view.ui.add(ccWidget, "bottom-left");
    const numberSearchPattern = /-?\d+[\.]?\d*/;

    const newFormat = new Format({
        // The format's name should be unique with respect to other formats used by the widget
        name: "XYZ",
        conversionInfo: {
            // Define a convert function
            // Point -> Position
            convert: function (point) {
                const returnPoint = point.spatialReference.isWGS84
                    ? point
                    : webMercatorUtils.webMercatorToGeographic(point);
                const x = returnPoint.x.toFixed(6);
                const y = returnPoint.y.toFixed(6);
                const z = returnPoint.z.toFixed(2);
                return {
                    location: returnPoint,
                    coordinate: `${x}, ${y}, ${z}`
                };
            },
            // Define a reverse convert function
            // String -> Point
            reverseConvert: function (string) {
                const parts = string.split(",");
                return new Point({
                    x: parseFloat(parts[0]),
                    y: parseFloat(parts[1]),
                    z: parseFloat(parts[2]),
                    spatialReference: { wkid: 4326 }
                });
            }
        },
        // Define each segment of the coordinate
        coordinateSegments: [
            {
                alias: "X",
                description: "Longitude",
                searchPattern: numberSearchPattern
            },
            {
                alias: "Y",
                description: "Latitude",
                searchPattern: numberSearchPattern
            },
            {
                alias: "Z",
                description: "Elevation",
                searchPattern: numberSearchPattern
            }
        ],
        defaultPattern: "X°, Y°, Z"
    });
    // add our new format to the widget's dropdown
    ccWidget.formats.add(newFormat);
    ccWidget.conversions.splice(
        0,
        0,
        new Conversion({
            format: newFormat
        })
    );

}
function AddLayers() {
    //---------------------------------------

    var verticalOffset = {
        screenLength: 50,
        maxWorldLength: 16876283,
        minWorldLength: 35
    };


    function getUniqueValueSymbol(name, color) {

        return {
            type: "point-3d", // autocasts as new PointSymbol3D()
            symbolLayers: [
                {
                    type: "icon", // autocasts as new IconSymbol3DLayer()
                    resource: {
                        href: name
                    },
                    size: 50,
                    outline: {
                        color: "white",
                        size: 2
                    }
                }
            ],

            verticalOffset: verticalOffset,

            callout: {
                type: "line", // autocasts as new LineCallout3D()
                color: "white",
                size: 2,
                border: {
                    color: color
                }
            }
        };
    }


    var pointsRenderer = {
        type: "unique-value", // autocasts as new UniqueValueRenderer()
        field: "type",
        uniqueValueInfos: [

            {
                value: "Digital Twin",
                label: "Projects Related to Buildings",
                symbol: getUniqueValueSymbol(
                    "images//building.png",
                    "#000000"
                )
            },
            {
                value: "Dashboard",
                label: "Projects Related to Dashboard",
                symbol: getUniqueValueSymbol(
                    "images//dashboard.png",
                    "#000000"
                )
            },
            {
                value: "Indoor",
                label: "Projects Related to Indoor",
                symbol: getUniqueValueSymbol(
                    "images//indoor.png",
                    "#000000"
                )
            },
            {
                value: "Utility",
                label: "Projects Related to Utility",
                symbol: getUniqueValueSymbol(
                    "images//utility.png",
                    "#000000"
                )
            },
            {
                value: "Underground",
                label: "Projects Related to Underground",
                symbol: getUniqueValueSymbol(
                    "images//underground2.png",
                    "#000000"
                )
            },
            {
                value: "IoT",
                label: "Projects Related to IoT",
                symbol: getUniqueValueSymbol(
                    "images//iot.png",
                    "#000000"
                )
            },
            {
                value: "OIC",
                label: "Projects Related to Oriented Imagery Catalog",
                symbol: getUniqueValueSymbol(
                    "images//OIC3.png",
                    "#000000"
                )
            },
            {
                value: "Panoramic",
                label: "Projects Related to Panoramic View",
                symbol: getUniqueValueSymbol(
                    "images//3603.png",
                    "#000000"
                )
            },

        ]
    };
    points = new FeatureLayer({
        title: "All Projects",
        url: "https://arcgis.mipmap.nl/server/rest/services/Hosted/MipMap_Apps_Point/FeatureServer",
        renderer: pointsRenderer,
        popupEnabled: true,
        outFields: ["*"],
        labelingInfo: [
            {
                labelExpressionInfo: {
                    value: "{Name}"
                },
                symbol: {
                    type: "label-3d", // autocasts as new LabelSymbol3D()
                    symbolLayers: [
                        {
                            type: "text", // autocasts as new TextSymbol3DLayer()
                            material: {
                                color: "white"
                            },
                            // we set a halo on the font to make the labels more visible with any kind of background
                            halo: {
                                size: 2,
                                color: [0, 0, 0]
                            },
                            size: 15
                        }
                    ]
                }
            }
        ],
        popupTemplate: {
            title: "Project Information",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "Name",
                            label: "Name"
                        },
                        {
                            fieldName: "type",
                            label: "Type"
                        },
                        {
                            fieldName: "Area",
                            label: "Area (m2)"
                        },
                        {
                            fieldName: "Total_Building",
                            label: "Building Count"
                        },
                        {
                            fieldName: "Url3D",
                            label: "Url 3D"
                        },
                        {
                            fieldName: "Url2D",
                            label: "Url 2D"
                        },

                    ]
                }
            ]
        },
    });
    map.layers.add(points);


    var legend = new Legend({
        view: view,
        container: "legendWidget",
    });


}


function initUI() {

    $('#chkOrtho').on('click', () => { points.visible = $('#chkOrtho').is(":checked"); });

    $('#chkAll').on('click', () => { points.definitionExpression = null; });
    $('#chkDT').on('click', () => { points.definitionExpression = "type = 'Digital Twin'"; });
    $('#chkDash').on('click', () => { points.definitionExpression = "type = 'Dashboard'"; });
    $('#chkindoor').on('click', () => { points.definitionExpression = "type = 'Indoor'"; });
    $('#chkUtility').on('click', () => { points.definitionExpression = "type = 'Utility'"; });
    $('#chkUnder').on('click', () => { points.definitionExpression = "type = 'Underground'"; });
    $('#chkPano').on('click', () => { points.definitionExpression = "type = 'Panoramic'"; });
    $('#chkIoT').on('click', () => { points.definitionExpression = "type = 'IoT'"; });
    $('#chkOIC').on('click', () => { points.definitionExpression = "type = 'OIC'"; });


    $('#chkhava').on('click', () => { $('#weatherBox').hide(); showWeatherInPosition(view.camera.position); });

    $('[data-button="toolbar"]').on('click', toolbarButton_onClick);


    var searchWidget = new Search({
        view: view,
        includeDefaultSources: false,
        allPlaceholder: "Search here",
        locationEnabled: false,
        sources: [
            {
                layer: points,
                searchFields: ["Type"],
                displayField: "Type",
                exactMatch: false,
                outFields: ["*"],
                name:"Search by Project Type",
                placeholder: "example: building"
            },
            {
                layer: points,
                searchFields: ["Name"],
                displayField: "Name",
                exactMatch: false,
                outFields: ["*"],
                name: "Search by Project Name",
                placeholder: "example: Fatih"
            }
        ],
        container: document.getElementById("searchBox")
    });
}



function toolbarButton_onClick(e) {
    if ($(e.currentTarget).hasClass("active")) {
        if (activeWidget) {
            activeWidget.destroy();
            activeWidget = null;
        }
        $(e.currentTarget).removeClass("active")
        return;
    }
    setActiveWidget($(e.currentTarget).attr("data-widget"));
}

function setActiveWidget(type) {
    if (activeWidget) {
        activeWidget.destroy();
        activeWidget = null;
    }
    switch (type) {
        case "home":
            view.goTo(homeCamera);
            setActiveButton(null);
            break;
        case "basemaps":

            activeWidget = new BasemapGallery({
                view: view,
                //container:document.getElementById( 'baseMapContainer')
            });


            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnBaseMaps"));
            break;

        case "distance":
            activeWidget = new DirectLineMeasurement3D({
                view: view
            });

            // skip the initial 'new measurement' button
            activeWidget.viewModel.start().catch((error) => {
                if (promiseUtils.isAbortError(error)) {
                    return; // don't display abort errors
                }
                throw error; // throw other errors since they are of interest
            });

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnMeasureLine"));
            break;
        case "area":
            activeWidget = new AreaMeasurement3D({
                view: view
            });

            // skip the initial 'new measurement' button
            activeWidget.viewModel.start().catch((error) => {
                if (promiseUtils.isAbortError(error)) {
                    return; // don't display abort errors
                }
                throw error; // throw other errors since they are of interest
            });

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnMeasurePoly"));
            break;
        case "profile":
            activeWidget = new ElevationProfile({
                view: view
            });



            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnMeasureProfile"));
            break;

        case "daylight":
            activeWidget = new Daylight({
                view: view
            });

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnDaylight"));
            break;

        case "weather":
            activeWidget = new Weather({
                view: view
            });

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnWeather"));
            break;

        case "slice":

            activeWidget = new Slice({
                view: view
            });
            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnSlice"));
            break;

        case "edit":

            activeWidget = new Editor({
                view: view,
                allowedWorkflows: ["update", "create", "create-feature"], // allows only updates and no adds,   
                layerInfos: [
                    { //autocastable to LayerInfo type
                        layer: BuildingEdit,
                        attachmentsOnUpdateEnabled: false // set this if wanting to remove the ability to select features in the editor with layers that have attachments and editing is enabled on them
                    }
                ]
            });

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("btnEdit"));
            break;

        case null:
            if (activeWidget) {
                view.ui.remove(activeWidget);
                activeWidget.destroy();
                activeWidget = null;
            }
            break;
    }
}
function setActiveButton(selectedButton) {
    // focus the view to activate keyboard shortcuts for sketching
    view.focus();
    const elements = document.getElementsByClassName("active");
    for (let i = 0; i < elements.length; i++) {
        elements[i].classList.remove("active");
    }
    if (selectedButton) {
        selectedButton.classList.add("active");
    }
}

function addBookmarks() {

}

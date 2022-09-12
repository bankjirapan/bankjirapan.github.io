function RainRadar(map, options) {
  var _this = this;
  this.map = map;
  this.apiData = [];

  this.isDisplay = true;

  this.timeDisplay = options.timeDisplay || null; // Display time of frames radar
  this.locale = options.locale || "th-Th";

  this.tileSize = options.tileSize || 512; // image size, can be 256 or 512.
  this.animation = false;
  this.radarColor = options.color || 7;
  this.opacity = options.opacity || 0.7;
  this.smooth = options.smooth || 1;
  this.snow = options.snow || 1;

  var _nowPosition = 16;
  this.animationPosition = _nowPosition; // default now
  var _startPastPosition = _nowPosition - 3;

  this.currentLayer = null;
  this.layerkey = "rain_radar";

  this.mapFrames = [];


  getWeatherMap();


  function getWeatherMap() {
    try {
      let apiRequest = new XMLHttpRequest();
      apiRequest.open(
        "GET",
        "https://api.rainviewer.com/public/weather-maps.json",
        true
      );
      apiRequest.onload = function (e) {
        if (!_this.apiData) throw new Error(`Can't get data`);
        _this.apiData = JSON.parse(apiRequest.response);
        initialize();
      };
      apiRequest.send();
    } catch (error) {
      _this.apiData = [];
    }
  }
  function initialize() {
	var map_frames_length = 0;
	if (_this.apiData.radar && _this.apiData.radar.past) {
		_this.mapFrames = _this.apiData.radar.past;
		_nowPosition = _this.apiData.radar.past.length - 1;
		_startPastPosition = _nowPosition - 3;
		if (_this.apiData.radar.nowcast) {
			_this.mapFrames = _this.mapFrames.concat(_this.apiData.radar.nowcast);
			map_frames_length = _this.mapFrames.length;
		}
	}
	_this.animationPosition = _nowPosition;
	const frame = _this.mapFrames[_this.animationPosition];
	addLayer(frame);
  }
  function addLayer(rainFrame) {
    _this.map.Event.bind("ready", () => {
	_this.mapFrames.forEach(frame => {
      var rainLayer = new longdo.Layer({
        layers: [
          {
            id: `rainviewer_${frame.path}`,
            type: "raster",
            source: {
				type: "raster",
				tiles: [_this.apiData.host+"/v2/radar/" +frame.path +"/" + _this.tileSize +"/{z}/{x}/{y}/"+_this.radarColor +"/1_1.png",
				],
				tileSize: _this.tileSize,
			},
            paint: {
              "raster-opacity": 0,
            },
          },
        ],
      });
	  _this.map.Layers.add(rainLayer);
    });

	_this.map.Renderer.setPaintProperty(
		`rainviewer_${rainFrame.path}`,
		"raster-opacity",
		0.5
	  );

	  _this.displayRadarTime(rainFrame.time)

   })  // Map Ready
  }

    function changeLayer(control = '') {
		var newLayer = null;
		var nowLayer = _this.mapFrames[_this.animationPosition];
		switch (control) {
			case 'next': {
				if ((_this.animationPosition += 1) == 16) {
					_this.animationPosition = _startPastPosition
					newLayer = _this.mapFrames[_this.animationPosition]
				} else {
					newLayer = _this.mapFrames[_this.animationPosition]
				}
				changeImages(newLayer, nowLayer)
				return
			}
			case 'back': {
				if ((_this.animationPosition -= 1) < _nowPosition - 3) {
					_this.animationPosition = _this.mapFrames.length - 1
					newLayer = _this.mapFrames[_this.animationPosition]
				} else {
					newLayer = _this.mapFrames[_this.animationPosition]
				}
				changeImages(newLayer, nowLayer)
				return
			}
		}
	}

	function changeImages(newLayer, now_layer) {
		_this.displayRadarTime(newLayer.time)
		_this.map.Renderer.setPaintProperty(
			`rainviewer_${now_layer.path}`,
			"raster-opacity",
			0
		  );
		_this.map.Renderer.setPaintProperty(
			`rainviewer_${newLayer.path}`,
			"raster-opacity",
			_this.opacity
		  );
	}

	this.rainNext = () => {
		changeLayer('next')
	}

	this.rainBack = () => {
		changeLayer('back')
	}

	this.rainNow = () => {
		changeLayer('now')
	}

  this.displayRadarTime = (time) => {
	if (_this.timeDisplay !== null) {
		const el = document.getElementById(_this.timeDisplay);
		if (!el) {
			return false;
		}

		el.innerHTML = new Date(
			time * 1000
		).toLocaleDateString(_this.locale, {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
		});
	}
};
}

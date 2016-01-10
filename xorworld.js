(function() {
  'use strict';
  // Initial settings
  var direction = 1; // for tracking zoom direction
  var flip = 0; // whether to XOR to the right (1) or to the left (0)
  var zoomy = false; // for autozoom feature
  var paused = false; // for pausing animation
  var lastTime = 0; // for calculating elapsed time between frames
  var delay = 100; // default wait between frames
  var isRandomized = false; // we like to track artificial grids ;-)
  var gen = 0; // generation counter
  var init = true; // for tracking render initialization
  var once = false; // for single redraws when paused
  var mono = false; // if we just care about black and white
  var gridSize = 12000; // number of bits

  // We'll retain a number of grids, so we can cycle through colors for
  // cells that keep their value across generations, and so we can walk
  // back and forward in time a bit.
  var grid;
  var memory = 20;
  resetGrid();

  // Shared between particle system updates/inits for convenience
  var particles;
  var particleSystem;

  // Setup three.js canvas
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, ww / wh, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(ww, wh - 100); // Leave space for menus
  document.body.appendChild(renderer.domElement);
  setupClickHandlers();
  render();

  function resetGrid() {
    grid = new Array(memory).fill([]);
  }

  // Generate a new chain based on XORing each value with its neighbor to the
  // left. If no chain exists, initialize each value with 1.
  function genChain() {
    if (grid.length === memory)
      grid.pop();

    grid.unshift(grid[0].slice(0)); // Make a copy to manipulate

    for (var c = 0; c < gridSize; c++) {
      var x;
      var leftNeighbor = c === 0 ? gridSize - 1 : c - 1;
      var rightNeighbor = c === gridSize - 1 ? 0 : c + 1;
      var neighbor;
      neighbor = flip ? rightNeighbor : leftNeighbor;

      if (grid[0][neighbor] === undefined)
        x = 1;
      else
        x = grid[0][neighbor] ^ grid[0][c];

      grid[0][c] = x;
    }
    gen++;
    $('#md5').text(CryptoJS.MD5(grid[0].join('')).toString());
  }

  // Update counter and calculate initial/new grid values
  function prepGrid() {
    $('#gen').text(gen);
    genChain();
  }

  // Create grid from scratch with initial values
  function initGrid() {
    prepGrid();
    particles = new THREE.Geometry();
    var pMaterial = new THREE.PointsMaterial({
      size: 5,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors
    });

    var gpos = 0;
    var xpos = -500;
    var ypos = 300;
    for (var l = 0; l < 60; l++) {
      for (var p = 0; p < 200; p++) {
        var pX = xpos;
        var pY = ypos;
        var pZ = -400;
        var particle = new THREE.Vector3(pX, pY, pZ);
        // add it to the geometry
        particles.vertices.push(particle);
        var color = getColor(gpos);
        particles.colors.push(color);
        xpos += 5;
        gpos++;
      }
      ypos -= 10;
      xpos = -500;
    }

    // create the particle system
    particleSystem = new THREE.Points(
      particles,
      pMaterial);
  }

  // Update an existing grid
  function updateGrid() {
    prepGrid();
    particles.colors = [];
    var gpos = 0;
    for (var l = 0; l < 60; l++) {
      for (var p = 0; p < 200; p++) {
        var color = getColor(gpos);
        particles.colors.push(color);
        particles.colorsNeedUpdate = true;
        gpos++;
      }
    }
  }

  function getColor(pos) {
    var newval = grid[0][pos];

    if (mono)
      return newval ? new THREE.Color(0xffffff) : new THREE.Color(0x000000);

    var color = 50;
    for (var i = 1; i < grid.length; i++) {
      var oldval = grid[i][pos];
      if (oldval === newval)
        color += 10;
      else
        break;
    }
    if (grid[0][pos])
      return new THREE.Color('rgb(0,0,' + color.toString() + ')');
    else
      return new THREE.Color('rgb(' + color.toString() + ',0,0)');
  }

  function setupClickHandlers() {
    $('#faster').click(function(e) {
      if (delay > 0) {
        delay -= 100;
      } else {
        $('#faster').fadeOut();
        $('#faster').fadeIn();
      }
    });

    $('#slower').click(function(e) {
      delay += 100;
    });

    $('#pause').click(function(e) {
      paused = !paused;
      $('#pause').toggleClass('toggled');
      if (paused)
        $('#pause').text('paused');
      else
        $('#pause').text('pause');
    });

    $('#zoom').click(function(e) {
      zoomy = !zoomy;
      $('#zoom').toggleClass('toggled');
      if (zoomy)
        $('#zoom').text('zooming');
      else
        $('#zoom').text('zoom');
    });

    $('#randomize').click(function(e) {
      resetGrid();
      updateGrid();
      for (var i = 0; i < gridSize; i++)
        grid[0][i] = Math.round(Math.random());
      gen = 1;
      $('#randomized').text(' (randomized)');
      isRandomized = true;
      once = true;
      if (!paused)
        $('#pause').click();
    });

    $('#save').click(function(e) {
      localStorage.setItem('xorGrid', grid[0].join(''));
      localStorage.setItem('xorIsRandomized', isRandomized);
      localStorage.setItem('xorGen', gen);
      $('#save').slideUp().slideDown();
      $('#load').show();
    });

    $('#load').click(function(e) {
      var state = localStorage.getItem('xorGrid');
      resetGrid();
      grid[0] = state.split('');
      gen = Number(localStorage.getItem('xorGen'));
      isRandomized = localStorage.getItem('xorIsRandomized') == 'true' ? true : false;
      if (isRandomized)
        $('#randomized').text(' (randomized)');
      else
        $('#randomized').text('');
      once = true;
      if (!paused)
        $('#pause').click();
    });

    if (localStorage.getItem('xorGrid')) {
      $('#load').show();
    }

    $('#mono').click(function(e) {
      if (paused)
        $('#pause').click();
      mono = !mono;
      $('#mono').toggleClass('toggled');
      if (mono)
        $('body').append('<iframe id="music" width="100%" hidden scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1245420&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>');
      else
        $('#music').remove();
    });

    $('#flip').click(function(e) {
      flip = !flip;
      $('#flip').toggleClass('toggled');
    });

    $('#reset').click(function(e) {
      once = true;
      resetGrid();
    });

  }

  // Render loop
  function render(time) {
    requestAnimationFrame(render);

    if ((paused && !once) || (time - lastTime) < delay) {
      return;
    }

    if (once)
      once = false;

    lastTime = time;

    if (zoomy) {
      if (direction) {
        camera.position.z -= 1;
        if (camera.position.z < -400)
          direction = 0;
      } else {
        camera.position.z += 1;
        if (camera.position.z > 500)
          direction = 1;
      }
    }
    if (init) {
      initGrid();
      scene.add(particleSystem);
      init = false;
    } else {
      updateGrid();
    }
    renderer.render(scene, camera);
  }
}());

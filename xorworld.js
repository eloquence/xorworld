(function() {
  'use strict';
  // Initial settings
  var direction = 1;        // for tracking zoom direction
  var zoomy = false;        // for autozoom feature
  var paused = false;       // for pausing animation
  var lastTime = 0;         // for calculating elapsed time between frames
  var delay = 100;          // default wait between frames
  var isRandomized = false; // we like to track artificial grids ;-)
  var gen = 0;              // generation counter
  var init = true;          // for tracking render initialization
  var once = false;         // for single redraws when paused

  var gridSize = 12000;     // number of bits
  var grid = [];            // grid array

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

  // Generate a new chain based on XORing each value with its neighbor to the
  // left. If no chain exists, initialize each value with 1.
  function genChain(chain, size) {
    for (var c = 0; c < size; c++) {
      var x;
      var leftNeighbor = c === 0 ? size - 1 : c - 1;
      if (chain[leftNeighbor] === undefined)
        x = true;
      else
        x = chain[leftNeighbor] ^ chain[c];
      chain[c] = x;
    }
    gen++;
  }

  // Update counter and calculate initial/new grid values
  function prepGrid() {
    $('#gen').text(gen);
    genChain(grid, gridSize);
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

    var xpos = -500;
    var ypos = 300;

    var gridCopy = grid.slice(0);
    for (var l = 0; l < 60; l++) {
      for (var p = 0; p < 200; p++) {
        var pX = xpos;
        var pY = ypos;
        var pZ = -400;
        var particle = new THREE.Vector3(pX, pY, pZ);
        // add it to the geometry
        particles.vertices.push(particle);
        var color = gridCopy.shift() ? new THREE.Color(0xffffff) :
          new THREE.Color(0x000000);
        particles.colors.push(color);
        xpos += 5;
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
    var gridCopy = grid.slice(0);
    for (var l = 0; l < 60; l++) {
      for (var p = 0; p < 200; p++) {
        var color = gridCopy.shift() ? new THREE.Color(0xffffff) :
          new THREE.Color(0x000000);
        particles.colors.push(color);
        particles.colorsNeedUpdate = true;
      }
    }
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
      $('#pause').toggleClass('paused');
      if (paused)
        $('#pause').text('paused');
      else
        $('#pause').text('pause');
    });

    $('#zoom').click(function(e) {
      zoomy = !zoomy;
      $('#zoom').toggleClass('zooming');
      if (zoomy)
        $('#zoom').text('zooming');
      else
        $('#zoom').text('zoom');
    });

    $('#randomize').click(function(e) {
      grid.forEach(function(ele, ind) {
        grid[ind] = Math.round(Math.random());
      });
      gen = 1;
      $('#randomized').text(' (randomized)');
      isRandomized = true;
      once = true;
      if (!paused)
        $('#pause').click();
    });

    $('#save').click(function(e) {
      localStorage.setItem('xorGrid', grid.join(''));
      localStorage.setItem('xorIsRandomized', isRandomized);
      localStorage.setItem('xorGen', gen);
      $('#save').slideUp().slideDown();
      $('#load').show();
    });

    $('#load').click(function(e) {
      var state = localStorage.getItem('xorGrid');
      grid = state.split('');
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

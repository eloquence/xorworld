(function() {
  'use strict';
  // Initial settings
  var direction = 1;
  var zoomy = false;
  var paused = false;
  var lastTime = 0;
  var delay = 100;
  var isRandomized = false;
  var gen = 0;

  // Setup threejs canvas
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, ww / wh, 0.1, 1000);

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(ww, wh-100);
  document.body.appendChild(renderer.domElement);

  // Generate a new chain based on XORing each value with its neighbor to the
  // left. If no chain exists, initialize each value with 1.
  function genChain(chain, size) {
    for (var c = 0; c < size; c++) {
      var x;
      var leftNeighbor = c === 0 ? size - 1 : c - 1;
      if (chain[leftNeighbor] === undefined)
        x = 1;
      else
        x = chain[leftNeighbor] ^ chain[c];
      chain[c] = x;
    }
    gen++;
  }

  // Prepare the particle system
  var particleSystem;
  var gridSize = 12000;
  var grid = [];

  function makeGrid() {

    $('#gen').text(gen);
    genChain(grid, gridSize);

    var particleCount = 100,
      particles = new THREE.Geometry(),
      pMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 5
      });

    var xpos = -500;
    var ypos = 300;

    var gridCopy = grid.slice(0);
    for (var l = 0; l < 60; l++) {
      for (var p = 0; p < 200; p++) {
        if (gridCopy.shift()) {
          var pX = xpos;
          var pY = ypos;
          var pZ = -400;
          var particle = new THREE.Vector3(pX, pY, pZ);
          // add it to the geometry
          particles.vertices.push(particle);
        }
        xpos += 5;
      }
      ypos -= 10;
      xpos = -500;
    }

    // create the particle system
    particleSystem = new THREE.Points(
      particles,
      pMaterial);

    // add it to the scene
    scene.add(particleSystem);
  }

  // Click handlers
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
    if(zoomy)
      $('#zoom').text('zooming');
    else
      $('#zoom').text('zoom');
  });

  $('#randomize').click(function(e) {
    grid.forEach(function(ele, ind) {grid[ind] = Math.round(Math.random()); });
    gen = 1;
    $('#randomized').text(' (randomized)');
    isRandomized = true;
    if (paused) {
      scene.remove(particleSystem);
      makeGrid();
      renderer.render(scene, camera);
    }
  });

  $('#save').click(function(e) {
    localStorage.setItem('xorGrid', grid.join(''));
    localStorage.setItem('xorIsRandomized', isRandomized);
    localStorage.setItem('xorGen', gen);
    $('#save').slideUp().slideDown();
    $('#load').show();
  });

  $('#load').click(function(e) {
    if(!paused)
      $('#pause').click();
    var state = localStorage.getItem('xorGrid');
    grid = state.split('');
    gen = Number(localStorage.getItem('xorGen'));
    isRandomized = localStorage.getItem('xorIsRandomized') == 'true' ? true : false;
    if (isRandomized)
      $('#randomized').text(' (randomized)');
    else
      $('#randomized').text();
    scene.remove(particleSystem);
    makeGrid();
    renderer.render(scene, camera);
  });

  if (localStorage.getItem('xorGrid')) {
    $('#load').show();
  }

  render();


  // Render loop
  function render(time) {
    requestAnimationFrame(render);

    if (paused || (time - lastTime) < delay) {
      return;
    }
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
    scene.remove(particleSystem);
    makeGrid();
    renderer.render(scene, camera);
  }
}());

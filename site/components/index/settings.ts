import createSettings from '@edgedb-site/shared/utils/createSettings';

export const {
  Settings, Pane, setInfo,
  readPaneSettings, usePaneSetting, readPaneSettingsAsArray,
} = createSettings({
  config: {
    title: 'Config',
  },

  settings: {
    scene_max_dpr: 1,
    scene_max_samples: 3,
    scene_camera_fov: 55,
    scene_camera_rot: { x: 0, y: 0, z: 0 },
    scene_camera_pos: { x: 0, y: 0, z: 5 },
    bg_nspace: 12,
    bg_lines: 3,
    bg_line_size_vari: { min: 0.3, max: 0.8 },
    bg_line_brightness: 87.04,
    bg_line_roughness: 1,
    bg_line_speedfactor: 1.2,
    bg_line_scrollfactor: 4,
    bg_line_parallax_pow: 101,
    bg_line_fade_after: 0.3,
    bg_line_fade_coeff: 2.4,
    bg_line_fade_max: 1.2,
    bg_line_curviness: 2,
    bg_scene: "#505050",
    bg_color1: "#68646f",
    bg_color2: "#57505a",
    bg_color3: "#47474e",
    bg_color4: "#504b52",
    bg_vignette_strength: 0,
    bg_blob1_pos: { x: 0.6563, y: -0.6906 },
    bg_blob1_strength: 0.28,
    bg_blob1_color: "#8a47fd",
    bg_blob1_dims: { x: 2.5, y: 2.3 },
    bg_blob2_pos: { x: -0.7031, y: 0.4438 },
    bg_blob2_strength: 0.22,
    bg_blob2_color: "#97a5fa",
    bg_blob2_dims: { x: 2.625, y: 2.6 },
    bg_blob3_pos: { x: -0.5313, y: -0.4563 },
    bg_blob3_strength: 0.14,
    bg_blob3_color: "#1cffd8",
    bg_blob3_dims: { x: 1.375, y: 1.85 },
    bg_blob4_pos: { x: 0.5, y: 0.4594 },
    bg_blob4_strength: 0.25,
    bg_blob4_color: "#fad799",
    bg_blob4_dims: { x: 3.375, y: 2.05 },
    bg_blob_fade_after: 0.3,
    bg_blob_fade_coeff: 0.24,
    bg_blob_fade_max: 0.6,
    bg_aces: true,
    bg_contrast: true,
    bg_contrast_r: { x: 1.8, y: 1 },
    bg_contrast_g: { x: 1.6, y: 1 },
    bg_contrast_b: { x: 1.6, y: 1.07 },
    bg_noise: true,
    bg_noise_speed: 0.28,
    bg_noise_intensity: 0.04,
    bg_noise_mean: 0,
    bg_noise_variance: 0.44,
    bg_random_seed: 72.85,
    ice_rot: { x: 0, y: 0, z: 0 },
    ice_pos: { x: -0.15, y: 1.5, z: -7 },
    ice_top_color: "#c6d1e2",
    ice_bottom_color: "#65b19d",
    ice_brightness: 2,
    ice_glow_color: "#533878",
    ice_glow_intensity: 1.74,
    ice_grid_color: "#00ffd0",
    ice_water_color: "#14363f",
    ice_water_opacity: 0.6,
    ice_noise_speed: 0.2,
    ice_noise_amplitude: 1,
    ice_grid_opacity: 1,
    ice_grid_thick: 1.25,
    ice_edgeline_color: "#00ffcf",
    ice_edgeline_thick: 0.01,
    ice_edgeline_glow: 0.82,
    debug_draw_nspace: false,
    debug_show_statsgl: false
  },

  layout: ({addBinding, addFolder, addFPS, addExport, addInfo}) => {
    addFPS();
    addInfo();

    addBinding('scene_max_dpr', {
      min: 0.5,
      max: 2,
      step: 0.5,
    });

    addBinding('scene_max_samples', {
      min: 0,
      max: 16,
      step: 1,
    });

    ////////////////////////////////////////////////////////////

    const lines = addFolder({title: 'Lines'});

    lines.addBinding('bg_nspace', {
      view: 'slider',
      step: 1,
      min: 3,
      max: 20,
    });

    lines.addBinding('bg_lines', {
      view: 'slider',
      step: 1,
      min: 1,
      max: 6,
    });

    lines.addSeparator();

    lines.addBinding('bg_line_size_vari', {min: 0, max: 1, step: 0.01});
    lines.addBinding('bg_line_brightness', {min: 0.1, max: 500, step: 0.01});
    lines.addBinding('bg_line_roughness', {min: 0.53, max: 1, step: 0.001});
    lines.addBinding('bg_line_curviness', {min: 0.1, max:10., step: 0.1});
    lines.addBinding('bg_line_speedfactor', {min: 0.001, max: 3, step: 0.001});
    lines.addBinding('bg_line_scrollfactor', {min: 0.1, max: 10, step: 0.1});
    lines.addBinding('bg_line_parallax_pow', {min: 5., max: 101, step: 1});

    lines.addSeparator();

    lines.addBinding('bg_line_fade_after', {min: 0, max: 10, step: 0.01});
    lines.addBinding('bg_line_fade_coeff', {min: 0.01, max: 10, step: 0.01});
    lines.addBinding('bg_line_fade_max', {min: 0.01, max: 50., step: 0.01});

    lines.addSeparator();

    lines.addBinding('bg_color1');
    lines.addBinding('bg_color2');
    lines.addBinding('bg_color3');
    lines.addBinding('bg_color4');

    ////////////////////////////////////////////////////////////

    const scene = addFolder({title: 'Scene'});

    scene.addBinding('bg_scene', {label: 'Scene Canvas Color'});
    scene.addBinding('bg_vignette_strength', {
      min: 0.,
      max: 1.,
      step: 0.01,
    });
    scene.addBinding('bg_random_seed', {min: 0.1, max: 100., step: 0.01});

    scene.addSeparator();
    scene.addBinding('bg_aces', {label: 'ACES Film'});

    scene.addSeparator();
    scene.addBinding('bg_contrast', {label: 'Cinematic Curve'});
    scene.addBinding('bg_contrast_r', {x: {min: -3, max: 3}, y: {min: -3, max: 3}});
    scene.addBinding('bg_contrast_g', {x: {min: -3, max: 3}, y: {min: -3, max: 3}});
    scene.addBinding('bg_contrast_b', {x: {min: -3, max: 3}, y: {min: -3, max: 3}});

    scene.addSeparator();
    scene.addBinding('bg_noise');
    scene.addBinding('bg_noise_speed', {min: 0.01, max: 1., step: 0.01});
    scene.addBinding('bg_noise_intensity', {min: 0.01, max: 1., step: 0.01});
    scene.addBinding('bg_noise_mean', {min: 0.00, max: 1., step: 0.01});
    scene.addBinding('bg_noise_variance', {min: 0.0, max: 1., step: 0.01});

    ////////////////////////////////////////////////////////////

    const bs = addFolder({title: 'Blobs', expanded: true});

    bs.addBinding('bg_blob1_pos', {x: {min: -1, max: 1}, y: {min: -1, max: 1}});
    bs.addBinding('bg_blob1_strength', {min: 0, max: 1, step: 0.01});
    bs.addBinding('bg_blob1_color');
    bs.addBinding('bg_blob1_dims', {x: {min: 0.1, max: 8}, y: {min: 0.1, max: 8}});
    bs.addSeparator();

    bs.addBinding('bg_blob2_pos', {x: {min: -1, max: 1}, y: {min: -1, max: 1}});
    bs.addBinding('bg_blob2_strength', {min: 0, max: 1, step: 0.01});
    bs.addBinding('bg_blob2_color');
    bs.addBinding('bg_blob2_dims', {x: {min: 0.1, max: 8}, y: {min: 0.1, max: 8}});
    bs.addSeparator();

    bs.addBinding('bg_blob3_pos', {x: {min: -1, max: 1}, y: {min: -1, max: 1}});
    bs.addBinding('bg_blob3_strength', {min: 0, max: 1, step: 0.01});
    bs.addBinding('bg_blob3_color');
    bs.addBinding('bg_blob3_dims', {x: {min: 0.1, max: 8}, y: {min: 0.1, max: 8}});
    bs.addSeparator();

    bs.addBinding('bg_blob4_pos', {x: {min: -1, max: 1}, y: {min: -1, max: 1}});
    bs.addBinding('bg_blob4_strength', {min: 0, max: 1, step: 0.01});
    bs.addBinding('bg_blob4_color');
    bs.addBinding('bg_blob4_dims', {x: {min: 0.1, max: 8}, y: {min: 0.1, max: 8}});
    bs.addSeparator();

    bs.addBinding('bg_blob_fade_after', {min: 0, max: 10, step: 0.01});
    bs.addBinding('bg_blob_fade_coeff', {min: 0.01, max: 10, step: 0.01});
    bs.addBinding('bg_blob_fade_max', {min: 0.01, max: 50., step: 0.01});

    ////////////////////////////////////////////////////////////

    const cam = addFolder({title: 'Camera'});

    cam.addBinding('scene_camera_fov', {
      view: 'cameraring',
      series: 2,
      unit: {
        pixels: 25,
        ticks: 3,
        value: 1,
      },
      min: 8,
      max: 120,
      step: 1,
    });

    cam.addBinding('scene_camera_rot', {
      view: 'rotation',
      rotationMode: 'euler',
      order: 'XYZ',
      unit: 'rad',
    });

    cam.addBinding('scene_camera_pos');

    ////////////////////////////////////////////////////////////

    const ice = addFolder({title: 'Iceberg'});

    ice.addBinding('ice_pos');
    ice.addBinding('ice_rot', {
      view: 'rotation',
      rotationMode: 'euler',
      order: 'XYZ',
      unit: 'rad',
    });

    ice.addSeparator();

    ice.addBinding('ice_top_color');
    ice.addBinding('ice_bottom_color');
    ice.addBinding('ice_brightness', {min: 0.1, max: 5, step: 0.01});

    ice.addSeparator();

    ice.addBinding('ice_glow_color');
    ice.addBinding('ice_glow_intensity', {min: 0.0, max: 5., step: 0.01});

    ice.addSeparator();

    ice.addBinding('ice_grid_color');
    ice.addBinding('ice_grid_opacity', {min: 0, max: 1, step: 0.01});
    ice.addBinding('ice_grid_thick', {min: 0, max: 5, step: 0.01});
    ice.addBinding('ice_noise_speed', {min: 0, max: 2, step: 0.01});
    ice.addBinding('ice_noise_amplitude', {min: 0, max: 3, step: 0.1});

    ice.addSeparator();
    ice.addBinding('ice_water_color');
    ice.addBinding('ice_water_opacity', {min: 0, max: 1, step: 0.01});

    ice.addSeparator();

    ice.addBinding('ice_edgeline_color');
    ice.addBinding('ice_edgeline_thick', {min: 0, max: 0.1, step: 0.001});
    ice.addBinding('ice_edgeline_glow', {min: 0, max: 3, step: 0.001});

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    const debug = addFolder({title: 'Debug'});
    debug.addBinding('debug_draw_nspace');
    debug.addBinding('debug_show_statsgl');

    ////////////////////////////////////////////////////////////

    addExport();
  }
});

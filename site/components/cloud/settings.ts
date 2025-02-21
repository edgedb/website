import createSettings from '@edgedb-site/shared/utils/createSettings';

const NLINES = 7;
const NBLOBS = 3;

export const {
  Settings, Pane,
  readPaneSettings, usePaneSetting,
} = createSettings({
  config: {
    title: 'Config',
  },

  settings: {
    scene_max_dpr: 1,
    bg_camera_zoom: 0.4,
    bg_camera_parallax: 500,
    bg_scene: "#090909",
    bg_scene_scroll_factor: 0.2,
    bg_grad_c1: "#55376e84",
    bg_grad_c2: "#cfb47a7d",
    bg_grad_c3: "#78358e4b",
    bg_line_formula: "0",
    bg_line1_p1_xy: { x: -9.0625, y: -1.8688 },
    bg_line1_p1_z: 1.3,
    bg_line1_p2_xy: { x: 7.8125, y: 1.8125 },
    bg_line1_p2_z: -2.61,
    bg_line1_strength: 1.1413,
    bg_line2_p1_xy: { x: -10, y: -0.6188 },
    bg_line2_p1_z: -1.5,
    bg_line2_p2_xy: { x: 9.6875, y: -4.4688 },
    bg_line2_p2_z: -1.5,
    bg_line2_strength: 1.087,
    bg_line3_p1_xy: { x: -10, y: -10 },
    bg_line3_p1_z: -4.35,
    bg_line3_p2_xy: { x: 9.6875, y: 0.4375 },
    bg_line3_p2_z: -1.74,
    bg_line3_strength: 0.3261,
    bg_line4_p1_xy: { x: -10, y: -0.8281 },
    bg_line4_p1_z: -2.17,
    bg_line4_p2_xy: { x: 9.6875, y: -10 },
    bg_line4_p2_z: -0.43,
    bg_line4_strength: 0.9783,
    bg_line5_p1_xy: { x: -6.4063, y: -6.625 },
    bg_line5_p1_z: 1.3,
    bg_line5_p2_xy: { x: 10, y: -3.825 },
    bg_line5_p2_z: -3,
    bg_line5_strength: 1.4674,
    bg_line6_p1_xy: { x: -10, y: -10 },
    bg_line6_p1_z: -0.43,
    bg_line6_p2_xy: { x: 10, y: -8 },
    bg_line6_p2_z: -1.3,
    bg_line6_strength: 1.6848,
    bg_line7_p1_xy: { x: -10, y: -10.5 },
    bg_line7_p1_z: -4,
    bg_line7_p2_xy: { x: 10, y: -10.5 },
    bg_line7_p2_z: -4,
    bg_line7_strength: 0,
    bg_blob1_c: "#a17db255",
    bg_blob1_p_xy: { x: -0.2688, y: 0.3181 },
    bg_blob1_p_z: 0.75,
    bg_blob1_strength: 2.4457,
    bg_blob2_c: "#81abb287",
    bg_blob2_p_xy: { x: 0.5, y: -0.2969 },
    bg_blob2_p_z: 0.43,
    bg_blob2_strength: 0.7065,
    bg_blob3_c: "#6f53e261",
    bg_blob3_p_xy: { x: -0.18, y: -0.5 },
    bg_blob3_p_z: 0.6,
    bg_blob3_strength: 0.7609,
    bg_aces: true,
    bg_contrast: true,
    bg_contrast_r: { x: 1, y: 1.3 },
    bg_contrast_g: { x: 1, y: 1.2 },
    bg_contrast_b: { x: 1, y: 1.37 },
    bg_noise: true,
    bg_noise_speed: 0.28,
    bg_noise_intensity: 0.04,
    bg_noise_mean: 0,
    bg_noise_variance: 0.44,
    bg_fade_after: 0.98,
    bg_fade_coeff: 0.5,
    bg_fade_max: 0.8,
    debug_show_statsgl: false
  },

  layout: ({addBinding, addFolder, addFPS, addExport}) => {
    addFPS();

    addBinding('scene_max_dpr', {
      min: 0.5,
      max: 2,
      step: 0.5,
    });


    ////////////////////////////////////////////////////////////

    const scene = addFolder({title: 'Scene'});

    scene.addBinding('bg_scene', {label: 'Scene Canvas Color'});

    scene.addSeparator();
    scene.addBinding('bg_scene_scroll_factor', {min: 0.001, max: 3., step: 0.001});

    scene.addSeparator();
    scene.addBinding('bg_fade_after', {min: 0, max: 10, step: 0.01});
    scene.addBinding('bg_fade_coeff', {min: 0.01, max: 10, step: 0.01});
    scene.addBinding('bg_fade_max', {min: 0.1, max: 50., step: 0.1});


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

    const cam = addFolder({title: 'Camera'});

    cam.addBinding('bg_camera_zoom', {min: 0.01, max: 2, step: 0.01});
    cam.addBinding('bg_camera_parallax', {min: 1, max: 500, step: 0.1});

    ////////////////////////////////////////////////////////////

    const lines = addFolder({title: 'Lines'});

    lines.addBinding('bg_grad_c1');
    lines.addBinding('bg_grad_c2');
    lines.addBinding('bg_grad_c3');

    lines.addSeparator();
    lines.addBinding('bg_line_formula', {
      options: {
        '1 - x': '0',
        'exp(-x * x)': '1',
      }
    });

    const XPOS_OPT = {min: -20, max: 20};
    const YPOS_OPT = {min: -20, max: 20, inverted: true};
    const ZPOS_OPT = {min: -20, max: 20, step: 0.01};

    for (let i = 1; i <= NLINES; i++) {
      lines.addSeparator();
      lines.addBinding(`bg_line${i}_p1_xy`, {x: XPOS_OPT, y: YPOS_OPT });
      lines.addBinding(`bg_line${i}_p1_z`, ZPOS_OPT);
      lines.addBinding(`bg_line${i}_p2_xy`, {x: XPOS_OPT, y: YPOS_OPT });
      lines.addBinding(`bg_line${i}_p2_z`, ZPOS_OPT);
      lines.addBinding(`bg_line${i}_strength`, {min: 0., max: 5.});
    }

    ////////////////////////////////////////////////////////////

    const blobs = addFolder({title: 'Blobs'});

    for (let i = 1; i <= NBLOBS; i++) {
      blobs.addBinding(`bg_blob${i}_c`);
      blobs.addBinding(`bg_blob${i}_p_xy`, {x: XPOS_OPT, y: YPOS_OPT });
      blobs.addBinding(`bg_blob${i}_p_z`, ZPOS_OPT);
      blobs.addBinding(`bg_blob${i}_strength`, {min: 0., max: 5.});
    }

    ////////////////////////////////////////////////////////////

    const debug = addFolder({title: 'Debug'});
    debug.addBinding('debug_show_statsgl');

    ////////////////////////////////////////////////////////////

    addExport();
  }
});

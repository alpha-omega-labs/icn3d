/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

import {Html} from '../../html/html.js';

import {ParasCls} from '../../utils/parasCls.js';

import {ShowAnno} from '../annotations/showAnno.js';
import {Selection} from '../selection/selection.js';
import {Resid2spec} from '../selection/resid2spec.js';

class SetSeqAlign {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    setSeqAlign(seqalign, alignedStructures) { var ic = this.icn3d, me = ic.icn3dui;
          //loadSeqAlignment
          var alignedAtoms = {}
          var mmdbid1 = alignedStructures[0][0].pdbId;
          var mmdbid2 = alignedStructures[0][1].pdbId;

          ic.conservedName1 = mmdbid1 + '_cons';
          ic.nonConservedName1 = mmdbid1 + '_ncons';
          ic.notAlignedName1 = mmdbid1 + '_nalign';

          ic.conservedName2 = mmdbid2 + '_cons';
          ic.nonConservedName2 = mmdbid2 + '_ncons';
          ic.notAlignedName2 = mmdbid2 + '_nalign';

          ic.consHash1 = {}
          ic.nconsHash1 = {}
          ic.nalignHash1 = {}

          ic.consHash2 = {}
          ic.nconsHash2 = {}
          ic.nalignHash2 = {}

          for(var i = 0, il = seqalign.length; i < il; ++i) {
              // first sequence
              var alignData = seqalign[i][0];
              var molid1 = alignData.moleculeId;

              var chain1 = ic.pdbid_molid2chain[mmdbid1 + '_' + molid1];
              var chainid1 = mmdbid1 + '_' + chain1;

              var id2aligninfo = {}
              var start = alignData.sequence.length, end = -1;
              var bStart = false;
              for(var j = 0, jl = alignData.sequence.length; j < jl; ++j) {
                  // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
                  //var resi = alignData.sequence[j][1];
                  var offset =(ic.chainid2offset[chainid1]) ? ic.chainid2offset[chainid1] : 0;
                  var resi =(ic.bUsePdbNum) ? alignData.sequence[j][0] + offset : alignData.sequence[j][0];
                  var resn =(alignData.sequence[j][2] === '~') ? '-' : alignData.sequence[j][2];
                  resn =(resn === ' ' || resn === '') ? 'X' : resn;
                  //resn = resn.toUpperCase();

                  var aligned =(alignData.sequence[j][3]) ? 1 : 0; // alignData.sequence[j][3]: 0, false, 1, true

                  if(aligned == 1) {
                      if(j < start && !bStart) {
                          start = j;
                          bStart = true; // set start just once
                      }
                      if(j > end) end = j;
                  }

                  id2aligninfo[j] = {"resi": resi, "resn": resn, "aligned": aligned}
              }

              // second sequence
              alignData = seqalign[i][1];
              var molid2 = alignData.moleculeId;

              var chain2 = ic.pdbid_molid2chain[mmdbid2 + '_' + molid2];
              var chainid2 = mmdbid2 + '_' + chain2;

              // annoation title for the master seq only
              if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];
              if(ic.alnChainsAnTtl[chainid1][0] === undefined ) ic.alnChainsAnTtl[chainid1][0] = [];
              if(ic.alnChainsAnTtl[chainid1][1] === undefined ) ic.alnChainsAnTtl[chainid1][1] = [];
              if(ic.alnChainsAnTtl[chainid1][2] === undefined ) ic.alnChainsAnTtl[chainid1][2] = [];
              if(ic.alnChainsAnTtl[chainid1][3] === undefined ) ic.alnChainsAnTtl[chainid1][3] = [];
              if(ic.alnChainsAnTtl[chainid1][4] === undefined ) ic.alnChainsAnTtl[chainid1][4] = [];
              if(ic.alnChainsAnTtl[chainid1][5] === undefined ) ic.alnChainsAnTtl[chainid1][5] = [];
              if(ic.alnChainsAnTtl[chainid1][6] === undefined ) ic.alnChainsAnTtl[chainid1][6] = [];

              // two annotations without titles
              ic.alnChainsAnTtl[chainid1][0].push(chainid2);
              ic.alnChainsAnTtl[chainid1][1].push(chainid1);
              ic.alnChainsAnTtl[chainid1][2].push("");
              ic.alnChainsAnTtl[chainid1][3].push("");

              // 2nd chain title
              ic.alnChainsAnTtl[chainid1][4].push(chainid2);
              // master chain title
              ic.alnChainsAnTtl[chainid1][5].push(chainid1);
              // empty line
              ic.alnChainsAnTtl[chainid1][6].push("");

              var alignIndex = 1;
              //for(var j = 0, jl = alignData.sseq.length; j < jl; ++j) {
              for(var j = start; j <= end; ++j) {
                  // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
                  //var resi = alignData.sequence[j][1];
                  //var resi = alignData.sequence[j][0];
                  var offset =(ic.chainid2offset[chainid2]) ? ic.chainid2offset[chainid2] : 0;
                  var resi =(ic.bUsePdbNum) ? alignData.sequence[j][0] + offset : alignData.sequence[j][0];
                  var resn =(alignData.sequence[j][2] === '~') ? '-' : alignData.sequence[j][2];
                  //resn = resn.toUpperCase();

                  var alignedTmp =(alignData.sequence[j][3]) ? 1 : 0; // alignData.sequence[j][3]: 0, false, 1, true

                  var aligned = id2aligninfo[j].aligned + alignedTmp; // 0 or 2

                  var color, color2, classname;
                  if(aligned === 2) { // aligned
                      if(id2aligninfo[j].resn === resn) {
                          color = '#FF0000';
                          classname = 'icn3d-cons';

                          ic.consHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                          ic.consHash2[chainid2 + '_' + resi] = 1;
                      }
                      else {
                          color = '#0000FF';
                          classname = 'icn3d-ncons';

                          ic.nconsHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                          ic.nconsHash2[chainid2 + '_' + resi] = 1;
                      }

                      color2 = '#' + ic.showAnnoCls.getColorhexFromBlosum62(id2aligninfo[j].resn, resn);

                      // expensive and thus remove
                      //alignedAtoms = me.hashUtilsCls.unionHash(alignedAtoms, ic.residues[chainid1 + '_' + id2aligninfo[j].resi]);
                      //alignedAtoms = me.hashUtilsCls.unionHash(alignedAtoms, ic.residues[chainid2 + '_' + resi]);
                  }
                  else {
                      color = ic.icn3dui.htmlCls.GREY8;
                      classname = 'icn3d-nalign';

                      ic.nalignHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                      ic.nalignHash2[chainid2 + '_' + resi] = 1;
                  }

                  // chain1
                  if(ic.alnChainsSeq[chainid1] === undefined) ic.alnChainsSeq[chainid1] = [];

                  var resObject = {}
                  resObject.mmdbid = mmdbid1;
                  resObject.chain = chain1;
                  resObject.resi = id2aligninfo[j].resi;
                  // resi will be empty if there is no coordinates
                  resObject.resn =(resObject.resi === '' || classname === 'icn3d-nalign') ? id2aligninfo[j].resn.toLowerCase() : id2aligninfo[j].resn;
                  resObject.aligned = aligned;
                  // resi will be empty if there is no coordinates
                  resObject.color =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color; // color by identity
                  resObject.color2 =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color2; // color by conservation
                  resObject.class = classname;

                  ic.alnChainsSeq[chainid1].push(resObject);

                  if(id2aligninfo[j].resi !== '') {
                      if(ic.alnChains[chainid1] === undefined) ic.alnChains[chainid1] = {}
                      $.extend(ic.alnChains[chainid1], ic.residues[chainid1 + '_' + id2aligninfo[j].resi] );
                  }

                  // chain2
                  if(ic.alnChainsSeq[chainid2] === undefined) ic.alnChainsSeq[chainid2] = [];

                  resObject = {}
                  resObject.mmdbid = mmdbid2;
                  resObject.chain = chain2;
                  resObject.resi = resi;
                  // resi will be empty if there is no coordinates
                  resObject.resn =(resObject.resi === '' || classname === 'icn3d-nalign') ? resn.toLowerCase() : resn;
                  resObject.aligned = aligned;
                  // resi will be empty if there is no coordinates
                  resObject.color =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color; // color by identity
                  resObject.color2 =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color2; // color by conservation
                  resObject.class = classname;

                  ic.alnChainsSeq[chainid2].push(resObject);

                  if(resObject.resi !== '') {
                      if(ic.alnChains[chainid2] === undefined) ic.alnChains[chainid2] = {}
                      $.extend(ic.alnChains[chainid2], ic.residues[chainid2 + '_' + resi] );
                  }

                  // annotation is for the master seq only
                  if(ic.alnChainsAnno[chainid1] === undefined ) ic.alnChainsAnno[chainid1] = [];
                  if(ic.alnChainsAnno[chainid1][0] === undefined ) ic.alnChainsAnno[chainid1][0] = [];
                  if(ic.alnChainsAnno[chainid1][1] === undefined ) ic.alnChainsAnno[chainid1][1] = [];
                  if(ic.alnChainsAnno[chainid1][2] === undefined ) ic.alnChainsAnno[chainid1][2] = [];
                  if(ic.alnChainsAnno[chainid1][3] === undefined ) ic.alnChainsAnno[chainid1][3] = [];
                  if(j === start) {
                      // empty line
                      // 2nd chain title
                      if(ic.alnChainsAnno[chainid1][4] === undefined ) ic.alnChainsAnno[chainid1][4] = [];
                      // master chain title
                      if(ic.alnChainsAnno[chainid1][5] === undefined ) ic.alnChainsAnno[chainid1][5] = [];
                      // empty line
                      if(ic.alnChainsAnno[chainid1][6] === undefined ) ic.alnChainsAnno[chainid1][6] = [];

                      ic.alnChainsAnno[chainid1][4].push(ic.pdbid_chain2title[chainid2]);
                      ic.alnChainsAnno[chainid1][5].push(ic.pdbid_chain2title[chainid1]);
                      ic.alnChainsAnno[chainid1][6].push('');
                  }

                  var residueid1 = chainid1 + '_' + id2aligninfo[j].resi;
                  var residueid2 = chainid2 + '_' + resi;
                  var ss1 = ic.secondaries[residueid1];
                  var ss2 = ic.secondaries[residueid2];
                  if(ss2 !== undefined) {
                      ic.alnChainsAnno[chainid1][0].push(ss2);
                  }
                  else {
                      ic.alnChainsAnno[chainid1][0].push('-');
                  }

                  if(ss1 !== undefined) {
                      ic.alnChainsAnno[chainid1][1].push(ss1);
                  }
                  else {
                      ic.alnChainsAnno[chainid1][1].push('-');
                  }

                  var symbol = '.';
                  if(alignIndex % 5 === 0) symbol = '*';
                  if(alignIndex % 10 === 0) symbol = '|';
                  ic.alnChainsAnno[chainid1][2].push(symbol); // symbol: | for 10th, * for 5th, . for rest

                  var numberStr = '';
                  if(alignIndex % 10 === 0) numberStr = alignIndex.toString();
                  ic.alnChainsAnno[chainid1][3].push(numberStr); // symbol: 10, 20, etc, empty for rest

                  ++alignIndex;
              } // end for(var j
          } // end for(var i

          seqalign = {}
    }

    setSeqAlignChain(chainid, chainIndex) { var ic = this.icn3d, me = ic.icn3dui;
          //loadSeqAlignment
          var alignedAtoms = {}

          //var chainidArray = ic.icn3dui.cfg.chainalign.split(',');
          var pos1 = ic.chainidArray[0].indexOf('_');
          var pos2 = chainid.indexOf('_');

          var mmdbid1 = ic.mmdbid_t; //ic.chainidArray[0].substr(0, pos1).toUpperCase();
          var mmdbid2 = chainid.substr(0, pos2).toUpperCase();

          var chain1 = ic.chainidArray[0].substr(pos1 + 1);
          var chain2 = chainid.substr(pos2 + 1);

          if(mmdbid1 == mmdbid2 && chain1 == chain2) {
            var chainLen = ic.chainsSeq[ic.mmdbid_q + '_' + ic.chain_q].length;
            ic.qt_start_end[chainIndex] =  {"q_start":1, "q_end": chainLen, "t_start":1, "t_end": chainLen}
          }

          var chainid1 = mmdbid1 + "_" + chain1;
          var chainid2 = mmdbid2 + "_" + chain2;

          if(mmdbid2 !== undefined && mmdbid2 === ic.mmdbid_t) {
              //chainid1 += ic.icn3dui.htmlCls.postfix;
              chainid2 = mmdbid2 + ic.icn3dui.htmlCls.postfix + "_" + chain2;
          }

          ic.conservedName1 = chainid1 + '_cons';
          ic.nonConservedName1 = chainid1 + '_ncons';
          ic.notAlignedName1 = chainid1 + '_nalign';

          ic.conservedName2 = chainid2 + '_cons';
          ic.nonConservedName2 = chainid2 + '_ncons';
          ic.notAlignedName2 = chainid2 + '_nalign';

          ic.consHash1 = {}
          ic.nconsHash1 = {}
          ic.nalignHash1 = {}

          ic.consHash2 = {}
          ic.nconsHash2 = {}
          ic.nalignHash2 = {}

          ic.alnChains = {}

          ic.alnChainsSeq[chainid1] = [];
          ic.alnChains[chainid1] = {}
          ic.alnChainsAnno[chainid1] = [];
          ic.alnChainsAnTtl[chainid1] = [];

          if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];
          for(var i = 0; i < 7; ++i) {
              if(ic.alnChainsAnTtl[chainid1][i] === undefined ) ic.alnChainsAnTtl[chainid1][i] = [];
          }

          // two annotations without titles
          ic.alnChainsAnTtl[chainid1][0].push(chainid2);
          ic.alnChainsAnTtl[chainid1][1].push(chainid1);
          ic.alnChainsAnTtl[chainid1][2].push("");
          ic.alnChainsAnTtl[chainid1][3].push("");

          // 2nd chain title
          ic.alnChainsAnTtl[chainid1][4].push(chainid2);
          // master chain title
          ic.alnChainsAnTtl[chainid1][5].push(chainid1);
          // empty line
          ic.alnChainsAnTtl[chainid1][6].push("");

          var color, color2, classname;
          var firstIndex1 = 0;
          var firstIndex2 = 0;
          var prevIndex1, prevIndex2;

          if(ic.qt_start_end[chainIndex] === undefined) return;

          var alignIndex = 1;
          for(var i = 0, il = ic.qt_start_end[chainIndex].length; i < il; ++i) {
              //var start1 = ic.qt_start_end[chainIndex][i].q_start - 1;
              //var start2 = ic.qt_start_end[chainIndex][i].t_start - 1;
              //var end1 = ic.qt_start_end[chainIndex][i].q_end - 1;
              //var end2 = ic.qt_start_end[chainIndex][i].t_end - 1;

              var start1 = ic.qt_start_end[chainIndex][i].t_start - 1;
              var start2 = ic.qt_start_end[chainIndex][i].q_start - 1;
              var end1 = ic.qt_start_end[chainIndex][i].t_end - 1;
              var end2 = ic.qt_start_end[chainIndex][i].q_end - 1;

              if(i > 0) {
                  var index1 = alignIndex;
                  for(var j = prevIndex1 + 1, jl = start1; j < jl; ++j) {
                      if(ic.chainsSeq[chainid1] === undefined) break;
                      var resi = ic.chainsSeq[chainid1][j].resi;
                      var resn = ic.chainsSeq[chainid1][j].name.toLowerCase();
                      color = ic.icn3dui.htmlCls.GREY8;
                      classname = 'icn3d-nalign';

                      ic.nalignHash1[chainid1 + '_' + resi] = 1;
                      this.setSeqPerResi(chainid1, chainid1, chainid2, resi, resn, false, color, undefined, classname, true, false, index1);
                      ++index1;
                  }

                  var index2 = alignIndex;
                  for(var j = prevIndex2 + 1, jl = start2; j < jl; ++j) {
                      if(ic.chainsSeq[chainid2] === undefined) break;
                      var resi = ic.chainsSeq[chainid2][j].resi;
                      var resn = ic.chainsSeq[chainid2][j].name.toLowerCase();

                      color = ic.icn3dui.htmlCls.GREY8;
                      classname = 'icn3d-nalign';

                      ic.nalignHash2[chainid2 + '_' + resi] = 1;
                      this.setSeqPerResi(chainid2, chainid1, chainid2, resi, resn, false, color, undefined, classname, false, false, index2);
                      ++index2; // count just once
                  }

                  if(index1 < index2) {
                      alignIndex = index2;

                      for(var j = 0; j < index2 - index1; ++j) {
                          var resi = '';
                          var resn = '-';

                          color = ic.icn3dui.htmlCls.GREY8;
                          classname = 'icn3d-nalign';

                          this.setSeqPerResi(chainid1, chainid1, chainid2, resi, resn, false, color, undefined, classname, true, false, index1 + j);
                      }
                  }
                  else {
                      alignIndex = index1;

                      for(var j = 0; j < index1 - index2; ++j) {
                          var resi = '';
                          var resn = '-';

                          color = ic.icn3dui.htmlCls.GREY8;
                          classname = 'icn3d-nalign';

                          this.setSeqPerResi(chainid2, chainid1, chainid2, resi, resn, false, color, undefined, classname, false, false, index2 + j);
                      }
                  }
              }


              for(var j = 0; j <= end1 - start1; ++j) {
                  if(ic.chainsSeq[chainid1] === undefined || ic.chainsSeq[chainid2] === undefined) break;

                  if(ic.chainsSeq[chainid1][j + start1] === undefined || ic.chainsSeq[chainid2][j + start2] === undefined) continue;

                  var resi1 = ic.chainsSeq[chainid1][j + start1].resi;
                  var resi2 = ic.chainsSeq[chainid2][j + start2].resi;
                  var resn1 = ic.chainsSeq[chainid1][j + start1].name.toUpperCase();
                  var resn2 = ic.chainsSeq[chainid2][j + start2].name.toUpperCase();

                  if(resn1 === resn2) {
                      color = '#FF0000';
                      classname = 'icn3d-cons';

                      ic.consHash1[chainid1 + '_' + resi1] = 1;
                      ic.consHash2[chainid2 + '_' + resi2] = 1;
                  }
                  else {
                      color = '#0000FF';
                      classname = 'icn3d-ncons';

                      ic.nconsHash1[chainid1 + '_' + resi1] = 1;
                      ic.nconsHash2[chainid2 + '_' + resi2] = 1;
                  }

                  color2 = '#' + ic.showAnnoCls.getColorhexFromBlosum62(resn1, resn2);

                  var bFirstResi =(i === 0 && j === 0) ? true : false;
                  this.setSeqPerResi(chainid1, chainid1, chainid2, resi1, resn1, true, color, color2, classname, true, bFirstResi, alignIndex);
                  this.setSeqPerResi(chainid2, chainid1, chainid2, resi2, resn2, true, color, color2, classname, false, bFirstResi, alignIndex);

                  ++alignIndex;
              } // end for(var j

              prevIndex1 = end1;
              prevIndex2 = end2;
          } // end for(var i
    }

    setSeqAlignForRealign(chainid_t, chainid, chainIndex) { var ic = this.icn3d, me = ic.icn3dui;
          //loadSeqAlignment
          var alignedAtoms = {}

          //var chainid_t = ic.chainidArray[0];

    //      var structureArray = Object.keys(ic.structures);
          var structure1 = chainid_t.substr(0, chainid_t.indexOf('_')); //structureArray[0];
          var structure2 = chainid.substr(0, chainid.indexOf('_')); //structureArray[1];

          if(structure1 == structure2) structure2 += ic.icn3dui.htmlCls.postfix;

          ic.conservedName1 = structure1 + '_cons';
          ic.conservedName2 = structure2 + '_cons';

          ic.consHash1 = {}
          ic.consHash2 = {}

          ic.alnChainsAnTtl = {}
          ic.alnChainsAnno = {}

          if(ic.alnChainsSeq === undefined) ic.alnChainsSeq = {}
          ic.alnChains = {}

          ic.alnChainsSeq[chainid_t] = [];
          ic.alnChains[chainid_t] = {}
          ic.alnChainsAnno[chainid_t] = [];
          ic.alnChainsAnTtl[chainid_t] = [];

    //      var emptyResObject = {resid: '', resn:'', resi: 0, aligned: false}

    //      var prevChainid1 = '', prevChainid2 = '', cnt1 = 0, cnt2 = 0;

          var residuesHash = {}

          for(var i = 0, il = ic.realignResid[structure1].length; i < il; ++i) {
              var resObject1 = ic.realignResid[structure1][i];
              var pos1 = resObject1.resid.lastIndexOf('_');
              var chainid1 = resObject1.resid.substr(0, pos1);
              var resi1 = resObject1.resid.substr(pos1 + 1);
              resObject1.resi = resi1;
              resObject1.aligned = true;

              var resObject2 = ic.realignResid[structure2][i];
              var pos2 = resObject2.resid.lastIndexOf('_');
              var chainid2 = resObject2.resid.substr(0, pos2);
              var resi2 = resObject2.resid.substr(pos2 + 1);
              resObject2.resi = resi2;
              resObject2.aligned = true;

              residuesHash[resObject1.resid] = 1;
              residuesHash[resObject2.resid] = 1;

              var color;
              if(resObject1.resn == resObject2.resn) {
                  color = "#FF0000";
              }
              else {
                  color = "#0000FF";
              }
              var color2 = '#' + ic.showAnnoCls.getColorhexFromBlosum62(resObject1.resn, resObject2.resn);

              resObject1.color = color;
              resObject2.color = color;

              resObject1.color2 = color2;
              resObject2.color2 = color2;

              for(var j in ic.residues[resObject1.resid]) {
                  ic.atoms[j].color = me.parasCls.thr(color);
              }
              for(var j in ic.residues[resObject2.resid]) {
                  ic.atoms[j].color = me.parasCls.thr(color);
              }

              // annoation title for the master seq only
              if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];

              for(var j = 0; j < 3; ++j) {
                  if(ic.alnChainsAnTtl[chainid1][j] === undefined ) ic.alnChainsAnTtl[chainid1][j] = [];
              }

              // two annotations without titles
              for(var j = 0; j < 3; ++j) {
                  ic.alnChainsAnTtl[chainid1][j].push("");
              }

              if(ic.alnChainsSeq[chainid1] === undefined) ic.alnChainsSeq[chainid1] = [];
              if(ic.alnChainsSeq[chainid2] === undefined) ic.alnChainsSeq[chainid2] = [];

              ic.alnChainsSeq[chainid1].push(resObject1);
              ic.alnChainsSeq[chainid2].push(resObject2);

              if(ic.alnChains[chainid1] === undefined) ic.alnChains[chainid1] = {}
              if(ic.alnChains[chainid2] === undefined) ic.alnChains[chainid2] = {}
              $.extend(ic.alnChains[chainid1], ic.residues[chainid1 + '_' + resObject1.resi] );
              $.extend(ic.alnChains[chainid2], ic.residues[chainid2 + '_' + resObject2.resi] );

              ic.consHash1[chainid1 + '_' + resObject1.resi] = 1;
              ic.consHash2[chainid2 + '_' + resObject2.resi] = 1;

              // annotation is for the master seq only
              if(ic.alnChainsAnno[chainid1] === undefined ) ic.alnChainsAnno[chainid1] = [];
              //if(ic.alnChainsAnno[chainid2] === undefined ) ic.alnChainsAnno[chainid2] = [];

              for(var j = 0; j < 3; ++j) {
                  if(ic.alnChainsAnno[chainid1][j] === undefined ) ic.alnChainsAnno[chainid1][j] = [];
              }

              var symbol = '.';
              if(i % 5 === 0) symbol = '*';
              if(i % 10 === 0) symbol = '|';
              ic.alnChainsAnno[chainid1][0].push(symbol); // symbol: | for 10th, * for 5th, . for rest

              var numberStr = '';
              if(i % 10 === 0) numberStr = i.toString();
              ic.alnChainsAnno[chainid1][1].push(numberStr); // symbol: 10, 20, etc, empty for rest
          }

            var commandname = 'protein_aligned';
            var commanddescr = 'protein aligned';
            var select = "select " + ic.resid2specCls.residueids2spec(Object.keys(residuesHash));
            ic.selectionCls.addCustomSelection(Object.keys(residuesHash), commandname, commanddescr, select, true);
    }

    setSeqPerResi(chainid, chainid1, chainid2, resi, resn, bAligned, color, color2, classname, bFirstChain, bFirstResi, alignIndex) { var ic = this.icn3d, me = ic.icn3dui;
          if(ic.alnChainsSeq[chainid] === undefined) ic.alnChainsSeq[chainid] = [];

          var resObject = {}
          var pos = chainid.indexOf('_');
          resObject.mmdbid = chainid.substr(0, pos);
          resObject.chain = chainid.substr(pos+1);
          resObject.resi = resi;
          // resi will be empty if there is no coordinates
          resObject.resn =(resObject.resi === '' || classname === 'icn3d-nalign') ? resn.toLowerCase() : resn;
          resObject.aligned = bAligned;
          // resi will be empty if there is no coordinates
          resObject.color =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color; // color by identity
          resObject.color2 =(resObject.resi === '') ? ic.icn3dui.htmlCls.GREYC : color2; // color by conservation
          resObject.class = classname;

          ic.alnChainsSeq[chainid].push(resObject);

          if(resObject.resi !== '') {
              if(ic.alnChains[chainid] === undefined) ic.alnChains[chainid] = {}
              $.extend(ic.alnChains[chainid], ic.residues[chainid + '_' + resObject.resi] );
          }

          if(bFirstChain) {
              // annotation is for the master seq only
              if(ic.alnChainsAnno[chainid] === undefined ) ic.alnChainsAnno[chainid] = [];
              if(ic.alnChainsAnno[chainid][0] === undefined ) ic.alnChainsAnno[chainid][0] = [];
              if(ic.alnChainsAnno[chainid][1] === undefined ) ic.alnChainsAnno[chainid][1] = [];
              if(ic.alnChainsAnno[chainid][2] === undefined ) ic.alnChainsAnno[chainid][2] = [];
              if(ic.alnChainsAnno[chainid][3] === undefined ) ic.alnChainsAnno[chainid][3] = [];
              if(bFirstResi) {
                  // empty line
                  // 2nd chain title
                  if(ic.alnChainsAnno[chainid][4] === undefined ) ic.alnChainsAnno[chainid][4] = [];
                  // master chain title
                  if(ic.alnChainsAnno[chainid][5] === undefined ) ic.alnChainsAnno[chainid][5] = [];
                  // empty line
                  if(ic.alnChainsAnno[chainid][6] === undefined ) ic.alnChainsAnno[chainid][6] = [];

                  var title1 = ic.pdbid_chain2title && ic.pdbid_chain2title.hasOwnProperty(chainid2) ? ic.pdbid_chain2title[chainid2] : ""
                  var title2 = ic.pdbid_chain2title && ic.pdbid_chain2title.hasOwnProperty(chainid) ? ic.pdbid_chain2title[chainid] : ""
                  ic.alnChainsAnno[chainid][4].push(title1);
                  ic.alnChainsAnno[chainid][5].push(title2);
                  ic.alnChainsAnno[chainid][6].push('');
              }

              var symbol = '.';
              if(alignIndex % 5 === 0) symbol = '*';
              if(alignIndex % 10 === 0) symbol = '|';
              ic.alnChainsAnno[chainid][2].push(symbol); // symbol: | for 10th, * for 5th, . for rest

              var numberStr = '';
              if(alignIndex % 10 === 0) numberStr = alignIndex.toString();
              ic.alnChainsAnno[chainid][3].push(numberStr); // symbol: 10, 20, etc, empty for rest

              var residueid = chainid + '_' + resi;
              var ss = ic.secondaries[residueid];

              if(ss !== undefined) {
                  ic.alnChainsAnno[chainid][1].push(ss);
              }
              else {
                  ic.alnChainsAnno[chainid][1].push('-');
              }
          }
          else {
              var residueid = chainid + '_' + resi;
              var ss = ic.secondaries[residueid];

              if(ic.alnChainsAnno.hasOwnProperty(chainid1) && ic.alnChainsAnno[chainid1].length > 0) {
                  if(ss !== undefined) {
                      ic.alnChainsAnno[chainid1][0].push(ss);
                  }
                  else {
                      ic.alnChainsAnno[chainid1][0].push('-');
                  }
              }
              else {
                  console.log("Error: ic.alnChainsAnno[chainid1] is undefined");
              }
          }
    }
}

export {SetSeqAlign}

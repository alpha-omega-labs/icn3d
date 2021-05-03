/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

import {Html} from '../../html/html.js';

import {FirstAtomObj} from '../selection/firstAtomObj.js';
import {ShowAnno} from '../annotations/showAnno.js';
import {ShowSeq} from '../annotations/showSeq.js';

class AnnoCddSite {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    //Show the annotations of CDD domains and binding sites.
    showCddSiteAll() { var ic = this.icn3d, me = ic.icn3dui;
        var thisClass = this;

        var chnidBaseArray = $.map(ic.protein_chainid, function(v) { return v; });
        var chnidArray = Object.keys(ic.protein_chainid);
        // show conserved domains and binding sites
        var url = ic.icn3dui.htmlCls.baseUrl + "cdannots/cdannots.fcgi?fmt&live=lcl&queries=" + chnidBaseArray;
        $.ajax({
          url: url,
          dataType: 'jsonp',
          cache: true,
          tryCount : 0,
          retryLimit : 1,
          success: function(data) {
              var chainWithData = {}
              for(var chainI = 0, chainLen = data.data.length; chainI < chainLen; ++chainI) {
                var cddData = data.data[chainI];
                var chnidBase = cddData._id;
                //var pos = chnidBaseArray.indexOf(chnidBase);
                //var chnid = chnidArray[pos];
                var chnid = chnidArray[chainI];
                chainWithData[chnid] = 1;
                var html = '<div id="' + ic.pre + chnid + '_cddseq_sequence" class="icn3d-cdd icn3d-dl_sequence">';
                var html2 = html;
                var html3 = html;
                var domainArray = cddData.doms;
                var result = thisClass.setDomainFeature(domainArray, chnid, true, html, html2, html3);

                html = result.html + '</div>';
                html2 = result.html2 + '</div>';
                html3 = result.html3 + '</div>';
                $("#" + ic.pre + "dt_cdd_" + chnid).html(html);
                $("#" + ic.pre + "ov_cdd_" + chnid).html(html2);
                $("#" + ic.pre + "tt_cdd_" + chnid).html(html3);

                html = '<div id="' + ic.pre + chnid + '_siteseq_sequence" class="icn3d-dl_sequence">';
                html2 = html;
                html3 = html;

                // features
                var featuteArray = cddData.motifs;
                var result = thisClass.setDomainFeature(featuteArray, chnid, false, html, html2, html3);

                html = result.html; // + '</div>';
                html2 = result.html2; // + '</div>';
                html3 = result.html3; // + '</div>';

                var siteArray = data.data[chainI].sites;
                var indexl =(siteArray !== undefined) ? siteArray.length : 0;
                for(var index = 0; index < indexl; ++index) {
                    var domain = siteArray[index].srcdom;
                    var type = siteArray[index].type;
                    var resCnt = siteArray[index].sz;
                    var title = 'site: ' + siteArray[index].title;
                    if(title.length > 17) title = title.substr(0, 17) + '...';
                    //var fulltitle = "site: " + siteArray[index].title + "(domain: " + domain + ")";
                    var fulltitle = siteArray[index].title;
                    var resPosArray, adjustedResPosArray = [];
                    for(var i = 0, il = siteArray[index].locs.length; i < il; ++i) {
                        resPosArray = siteArray[index].locs[i].coords;
                        for(var j = 0, jl = resPosArray.length; j < jl; ++j) {
                            //adjustedResPosArray.push(Math.round(resPosArray[j]) + ic.baseResi[chnid]);
                            adjustedResPosArray.push(thisClass.getAdjustedResi(Math.round(resPosArray[j]), chnid, ic.matchedPos, ic.chainsSeq, ic.baseResi) - 1);
                        }
                    }
                    var htmlTmp2 = '<div class="icn3d-seqTitle icn3d-link icn3d-blue" site="site" posarray="' + adjustedResPosArray.toString() + '" shorttitle="' + title + '" setname="' + chnid + '_site_' + index + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + title + ' </div>';
                    var htmlTmp3 = '<span class="icn3d-residueNum" title="residue count">' + resCnt.toString() + ' Res</span>';
                    var htmlTmp = '<span class="icn3d-seqLine">';
                    html3 += htmlTmp2 + htmlTmp3 + '<br>';
                    html += htmlTmp2 + htmlTmp3 + htmlTmp;
                    html2 += htmlTmp2 + htmlTmp3 + htmlTmp;
                    var pre = 'site' + index.toString();
                    //var widthPerRes = ic.seqAnnWidth / ic.maxAnnoLength;
                    var prevEmptyWidth = 0;
                    var prevLineWidth = 0;
                    var widthPerRes = 1;
                    for(var i = 0, il = ic.giSeq[chnid].length; i < il; ++i) {
                      html += ic.showSeqCls.insertGap(chnid, i, '-');
                      if(resPosArray.indexOf(i) != -1) {
                          var cFull = ic.giSeq[chnid][i];
                          var c = cFull;
                          if(cFull.length > 1) {
                              c = cFull[0] + '..';
                          }
                          //var pos =(i >= ic.matchedPos[chnid] && i - ic.matchedPos[chnid] < ic.chainsSeq[chnid].length) ? ic.chainsSeq[chnid][i - ic.matchedPos[chnid]].resi : ic.baseResi[chnid] + 1 + i;
                          var pos = thisClass.getAdjustedResi(i, chnid, ic.matchedPos, ic.chainsSeq, ic.baseResi);

                        html += '<span id="' + pre + '_' + ic.pre + chnid + '_' + pos + '" title="' + c + pos + '" class="icn3d-residue">' + cFull + '</span>';
                        html2 += ic.showSeqCls.insertGapOverview(chnid, i);
                        var emptyWidth =(ic.icn3dui.cfg.blast_rep_id == chnid) ? Math.round(ic.seqAnnWidth * i /(ic.maxAnnoLength + ic.nTotalGap) - prevEmptyWidth - prevLineWidth) : Math.round(ic.seqAnnWidth * i / ic.maxAnnoLength - prevEmptyWidth - prevLineWidth);
                        //if(emptyWidth < 0) emptyWidth = 0;
                        if(emptyWidth >= 0) {
                        html2 += '<div style="display:inline-block; width:' + emptyWidth + 'px;">&nbsp;</div>';
                        html2 += '<div style="display:inline-block; background-color:#000; width:' + widthPerRes + 'px;" title="' + c + pos + '">&nbsp;</div>';
                        prevEmptyWidth += emptyWidth;
                        prevLineWidth += widthPerRes;
                        }
                      }
                      else {
                        html += '<span>-</span>'; //'<span>-</span>';
                      }
                    }
                    htmlTmp = '<span class="icn3d-residueNum" title="residue count">&nbsp;' + resCnt.toString() + ' Residues</span>';
                    htmlTmp += '</span>';
                    htmlTmp += '<br>';
                    html += htmlTmp;
                    html2 += htmlTmp;
                }
                html += '</div>';
                html2 += '</div>';
                html3 += '</div>';
                $("#" + ic.pre + "dt_site_" + chnid).html(html);
                $("#" + ic.pre + "ov_site_" + chnid).html(html2);
                $("#" + ic.pre + "tt_site_" + chnid).html(html3);
            } // outer for loop
            // missing CDD data
            for(var chnid in ic.protein_chainid) {
                if(!chainWithData.hasOwnProperty(chnid)) {
                    $("#" + ic.pre + "dt_cdd_" + chnid).html('');
                    $("#" + ic.pre + "ov_cdd_" + chnid).html('');
                    $("#" + ic.pre + "tt_cdd_" + chnid).html('');
                    $("#" + ic.pre + "dt_site_" + chnid).html('');
                    $("#" + ic.pre + "ov_site_" + chnid).html('');
                    $("#" + ic.pre + "tt_site_" + chnid).html('');
                }
            }
            // add here after the ajax call
            ic.showAnnoCls.enableHlSeq();
            ic.bAjaxCddSite = true;
            if(ic.deferredAnnoCddSite !== undefined) ic.deferredAnnoCddSite.resolve();
          },
          error : function(xhr, textStatus, errorThrown ) {
            this.tryCount++;
            if(this.tryCount <= this.retryLimit) {
                //try again
                $.ajax(this);
                return;
            }
            console.log( "No CDD data were found for the protein " + chnidBaseArray + "..." );
            for(var chnid in ic.protein_chainid) {
                $("#" + ic.pre + "dt_cdd_" + chnid).html('');
                $("#" + ic.pre + "ov_cdd_" + chnid).html('');
                $("#" + ic.pre + "tt_cdd_" + chnid).html('');
                $("#" + ic.pre + "dt_site_" + chnid).html('');
                $("#" + ic.pre + "ov_site_" + chnid).html('');
                $("#" + ic.pre + "tt_site_" + chnid).html('');
            }
            // add here after the ajax call
            ic.showAnnoCls.enableHlSeq();
            ic.bAjaxCddSite = true;
            if(ic.deferredAnnoCddSite !== undefined) ic.deferredAnnoCddSite.resolve();
            return;
          }
        });
    }

    setDomainFeature(domainArray, chnid, bDomain, html, html2, html3) { var ic = this.icn3d, me = ic.icn3dui;
        var thisClass = this;

        var indexl =(domainArray !== undefined) ? domainArray.length : 0;
        var maxTextLen =(bDomain) ? 14 : 17;
        var titleSpace =(bDomain) ? 100 : 120;
        for(var index = 0; index < indexl; ++index) {
            var acc =(bDomain) ? domainArray[index].acc : domainArray[index].srcdom;
            var type = domainArray[index].type;
            type =(bDomain) ? 'domain' : 'feat';
            var domain =(bDomain) ? domainArray[index].title.split(':')[0] : domainArray[index].title;
            var defline =(bDomain) ? domainArray[index].defline : '';
            var title = type + ': ' + domain;

            if(title.length > maxTextLen) title = title.substr(0, maxTextLen) + '...';
            var fulltitle = type + ": " + domain;
            // each domain may have several repeat. Treat each repeat as a domain
            var domainRepeatArray = domainArray[index].locs;

            if(!domainRepeatArray) continue;

            for(var r = 0, rl = domainRepeatArray.length; r < rl; ++r) {
                // each domain repeat or domain may have several segments, i.e., a domain may not be continous
                var fromArray = [], toArray = [];
                var resiHash = {}
                var resCnt = 0;
                var segArray =(bDomain) ? domainRepeatArray[r].segs : [domainRepeatArray[r]];
                for(var s = 0, sl = segArray.length; s < sl; ++s) {
                    var domainFrom = Math.round(segArray[s].from);
                    var domainTo = Math.round(segArray[s].to);
                    //fromArray.push(domainFrom + ic.baseResi[chnid]);
                    //toArray.push(domainTo + ic.baseResi[chnid]);
                    fromArray.push(thisClass.getAdjustedResi(domainFrom, chnid, ic.matchedPos, ic.chainsSeq, ic.baseResi) - 1);
                    toArray.push(thisClass.getAdjustedResi(domainTo, chnid, ic.matchedPos, ic.chainsSeq, ic.baseResi) - 1);
                    for(var i = domainFrom; i <= domainTo; ++i) {
                        resiHash[i] = 1;
                    }
                    resCnt += domainTo - domainFrom + 1;
                }

                var htmlTmp2 = '<div class="icn3d-seqTitle icn3d-link icn3d-blue" ' + type + '="' + acc + '" from="' + fromArray + '" to="' + toArray + '" shorttitle="' + title + '" setname="' + chnid + '_' + type + '_' + index + '_' + r + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + title + ' </div>';
                var htmlTmp3 = '<span class="icn3d-residueNum" title="residue count">' + resCnt.toString() + ' Res</span>';
                html3 += htmlTmp2 + htmlTmp3 + '<br>';
                var htmlTmp = '<span class="icn3d-seqLine">';
                html += htmlTmp2 + htmlTmp3 + htmlTmp;
                if(bDomain) {
                    html2 += '<div style="width:20px; display:inline-block;"><span id="' + ic.pre + chnid + '_' + acc + '_' + r + '_cddseq_expand" class="ui-icon ui-icon-plus icn3d-expand icn3d-link" style="width:15px;" title="Expand"></span><span id="' + ic.pre + chnid + '_' + acc + '_' + r + '_cddseq_shrink" class="ui-icon ui-icon-minus icn3d-shrink icn3d-link" style="display:none; width:15px;" title="Shrink"></span></div>';
                }
                html2 += '<div style="width:' + titleSpace + 'px!important;" class="icn3d-seqTitle icn3d-link icn3d-blue" ' + type + '="' + acc + '" from="' + fromArray + '" to="' + toArray + '" shorttitle="' + title + '" index="' + index + '" setname="' + chnid + '_' + type + '_' + index + '_' + r + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + title + ' </div>';
                html2 += htmlTmp3 + htmlTmp;
                var pre = type + index.toString();
                for(var i = 0, il = ic.giSeq[chnid].length; i < il; ++i) {
                  html += ic.showSeqCls.insertGap(chnid, i, '-');
                  if(resiHash.hasOwnProperty(i)) {
                      var cFull = ic.giSeq[chnid][i];
                      var c = cFull;
                      if(cFull.length > 1) {
                          c = cFull[0] + '..';
                      }
                      //var pos =(i >= ic.matchedPos[chnid] && i - ic.matchedPos[chnid] < ic.chainsSeq[chnid].length) ? ic.chainsSeq[chnid][i - ic.matchedPos[chnid]].resi : ic.baseResi[chnid] + 1 + i;
                      var pos = thisClass.getAdjustedResi(i, chnid, ic.matchedPos, ic.chainsSeq, ic.baseResi);
                      html += '<span id="' + pre + '_' + ic.pre + chnid + '_' + pos + '" title="' + c + pos + '" class="icn3d-residue">' + cFull + '</span>';
                  }
                  else {
                      html += '<span>-</span>'; //'<span>-</span>';
                  }
                }
                var atom = ic.firstAtomObjCls.getFirstCalphaAtomObj(ic.chains[chnid]);
                var colorStr =(atom.color === undefined || atom.color.getHexString() === 'FFFFFF') ? 'DDDDDD' : atom.color.getHexString();
                var color =(atom.color !== undefined) ? colorStr : "CCCCCC";
                if(ic.icn3dui.cfg.blast_rep_id != chnid) { // regular
                    for(var i = 0, il = fromArray.length; i < il; ++i) {
                        var emptyWidth =(i == 0) ? Math.round(ic.seqAnnWidth *(fromArray[i] - ic.baseResi[chnid] - 1) / ic.maxAnnoLength) : Math.round(ic.seqAnnWidth *(fromArray[i] - toArray[i-1] - 1) / ic.maxAnnoLength);
                        html2 += '<div style="display:inline-block; width:' + emptyWidth + 'px;">&nbsp;</div>';
                        html2 += '<div style="display:inline-block; color:white!important; font-weight:bold; background-color:#' + color + '; width:' + Math.round(ic.seqAnnWidth *(toArray[i] - fromArray[i] + 1) / ic.maxAnnoLength) + 'px;" class="icn3d-seqTitle icn3d-link icn3d-blue" domain="' +(index+1).toString() + '" from="' + fromArray + '" to="' + toArray + '" shorttitle="' + title + '" index="' + index + '" setname="' + chnid + '_domain_' + index + '_' + r + '" id="' + chnid + '_domain_' + index + '_' + r + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + domain + ' </div>';
                    }
                }
                else { // with potential gaps
                    var fromArray2 = [], toArray2 = [];
                    for(var i = 0, il = fromArray.length; i < il; ++i) {
                        fromArray2.push(fromArray[i]);
                        for(var j = fromArray[i]; j <= toArray[i]; ++j) {
                            if(ic.targetGapHash !== undefined && ic.targetGapHash.hasOwnProperty(j)) {
                                toArray2.push(j - 1);
                                fromArray2.push(j);
                            }
                        }
                        toArray2.push(toArray[i]);
                    }
                    for(var i = 0, il = fromArray2.length; i < il; ++i) {
                        html2 += ic.showSeqCls.insertGapOverview(chnid, fromArray2[i]);
                        var emptyWidth =(i == 0) ? Math.round(ic.seqAnnWidth *(fromArray2[i] - ic.baseResi[chnid] - 1) /(ic.maxAnnoLength + ic.nTotalGap)) : Math.round(ic.seqAnnWidth *(fromArray2[i] - toArray2[i-1] - 1) /(ic.maxAnnoLength + ic.nTotalGap));
                        html2 += '<div style="display:inline-block; width:' + emptyWidth + 'px;">&nbsp;</div>';
                        html2 += '<div style="display:inline-block; color:white!important; font-weight:bold; background-color:#' + color + '; width:' + Math.round(ic.seqAnnWidth *(toArray2[i] - fromArray2[i] + 1) /(ic.maxAnnoLength + ic.nTotalGap)) + 'px;" class="icn3d-seqTitle icn3d-link icn3d-blue" domain="' +(index+1).toString() + '" from="' + fromArray2 + '" to="' + toArray2 + '" shorttitle="' + title + '" index="' + index + '" setname="' + chnid + '_domain_' + index + '_' + r + '" id="' + chnid + '_domain_' + index + '_' + r + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + domain + ' </div>';
                    }
                }
                htmlTmp = '<span class="icn3d-residueNum" title="residue count">&nbsp;' + resCnt.toString() + ' Residues</span>';
                htmlTmp += '</span>';
                htmlTmp += '<br>';
                html += htmlTmp;
                html2 += htmlTmp;
                if(bDomain) {
                    html2 += '<div id="' + ic.pre + chnid + '_' + acc + '_' + r + '_cddseq" style="display:none; white-space:normal;" class="icn3d-box">' + defline + '(<a href="' + ic.icn3dui.htmlCls.baseUrl + 'cdd/cddsrv.cgi?uid=' + acc + '" target="_blank" class="icn3d-blue">open details view...</a>)</div>';
                }
            } // for(var r = 0,
        }

        return {html: html, html2: html2, html3: html3}
    }

    getAdjustedResi(resi, chnid, matchedPos, chainsSeq, baseResi) { var ic = this.icn3d, me = ic.icn3dui;
        return(resi >= matchedPos[chnid] && resi - matchedPos[chnid] < ic.chainsSeq[chnid].length) ? ic.chainsSeq[chnid][resi - matchedPos[chnid]].resi : baseResi[chnid] + 1 + resi;
    }

    showAnnoType(chnid, chnidBase, type, title, residueArray, resid2resids) { var ic = this.icn3d, me = ic.icn3dui;
        var html = '<div id="' + ic.pre + chnid + '_' + type + 'seq_sequence" class="icn3d-dl_sequence">';
        var html2 = html;
        var html3 = html;
        if(residueArray.length == 0) {
            $("#" + ic.pre + "dt_" + type + "_" + chnid).html('');
            $("#" + ic.pre + "ov_" + type + "_" + chnid).html('');
            $("#" + ic.pre + "tt_" + type + "_" + chnid).html('');
            return;
        }
        var fulltitle = title;
        if(title.length > 17) title = title.substr(0, 17) + '...';
        var resPosArray = [];
        for(var i = 0, il = residueArray.length; i < il; ++i) {
            var resid = residueArray[i];
            var resi = Math.round(resid.substr(residueArray[i].lastIndexOf('_') + 1) );
            resPosArray.push( resi );
        }
        var resCnt = resPosArray.length;
        var chainnameNospace = type;
        var htmlTmp2 = '<div class="icn3d-seqTitle icn3d-link icn3d-blue" ' + type + '="" posarray="' + resPosArray.toString() + '" shorttitle="' + title + '" setname="' + chnid + '_' + chainnameNospace + '" anno="sequence" chain="' + chnid + '" title="' + fulltitle + '">' + title + ' </div>';
        var htmlTmp3 = '<span class="icn3d-residueNum" title="residue count">' + resCnt.toString() + ' Res</span>';
        html3 += htmlTmp2 + htmlTmp3 + '<br>';
        var htmlTmp = '<span class="icn3d-seqLine">';
        html += htmlTmp2 + htmlTmp3 + htmlTmp;
        html2 += htmlTmp2 + htmlTmp3 + htmlTmp;
        var pre = type;
        var prevEmptyWidth = 0;
        var prevLineWidth = 0;
        var widthPerRes = 1;
        for(var i = 0, il = ic.giSeq[chnid].length; i < il; ++i) {
          html += ic.showSeqCls.insertGap(chnid, i, '-');
          if(resPosArray.indexOf(i+1 + ic.baseResi[chnid]) != -1) {
              var cFull = ic.giSeq[chnid][i];
              var c = cFull;
              if(cFull.length > 1) {
                  c = cFull[0] + '..';
              }
              var pos =(i >= ic.matchedPos[chnid] && i - ic.matchedPos[chnid] < ic.chainsSeq[chnid].length) ? ic.chainsSeq[chnid][i - ic.matchedPos[chnid]].resi : ic.baseResi[chnid] + 1 + i;
              var resid = chnid + '_' +(i+1 + ic.baseResi[chnid]).toString();
              var title = cFull +(i+1 + ic.baseResi[chnid]).toString();
              if(type == 'ssbond') {
                  title = 'Residue ' + resid + ' has disulfide bond with';
                  if(resid2resids[resid] !== undefined) {
                      for(var j = 0, jl = resid2resids[resid].length; j < jl; ++j) {
                          title += ' residue ' + resid2resids[resid][j];
                      }
                  }
              }
              else if(type == 'crosslink') {
                  title = 'Residue ' + resid + ' has cross-linkage with';
                  if(resid2resids[resid] !== undefined) {
                      for(var j = 0, jl = resid2resids[resid].length; j < jl; ++j) {
                          title += ' residue ' + resid2resids[resid][j];
                      }
                  }
              }
              html += '<span id="' + pre + '_' + ic.pre + chnid + '_' + pos + '" title="' + title + '" class="icn3d-residue">' + c + '</span>';
              html2 += ic.showSeqCls.insertGapOverview(chnid, i);
              var emptyWidth =(ic.icn3dui.cfg.blast_rep_id == chnid) ? Math.round(ic.seqAnnWidth * i /(ic.maxAnnoLength + ic.nTotalGap) - prevEmptyWidth - prevLineWidth) : Math.round(ic.seqAnnWidth * i / ic.maxAnnoLength - prevEmptyWidth - prevLineWidth);
                //if(emptyWidth < 0) emptyWidth = 0;
                if(emptyWidth >= 0) {
                html2 += '<div style="display:inline-block; width:' + emptyWidth + 'px;">&nbsp;</div>';
                html2 += '<div style="display:inline-block; background-color:#000; width:' + widthPerRes + 'px;" title="' + title + '">&nbsp;</div>';
                prevEmptyWidth += emptyWidth;
                prevLineWidth += widthPerRes;
                }
          }
          else {
            html += '<span>-</span>'; //'<span>-</span>';
          }
        }
        htmlTmp = '<span class="icn3d-residueNum" title="residue count">&nbsp;' + resCnt.toString() + ' Residues</span>';
        htmlTmp += '</span>';
        htmlTmp += '<br>';
        html += htmlTmp;
        html2 += htmlTmp;
        html += '</div>';
        html2 += '</div>';
        html3 += '</div>';
        $("#" + ic.pre + "dt_" + type + "_" + chnid).html(html);
        $("#" + ic.pre + "ov_" + type + "_" + chnid).html(html2);
        $("#" + ic.pre + "tt_" + type + "_" + chnid).html(html3);
    }

    // jquery tooltip
    //https://stackoverflow.com/questions/18231315/jquery-ui-tooltip-html-with-links
    setToolTip() {  var ic = this.icn3d, me = ic.icn3dui;
      $("[id^=" + ic.pre + "snp]").add("[id^=" + ic.pre + "clinvar]").add("[id^=" + ic.pre + "ssbond]").add("[id^=" + ic.pre + "crosslink]").tooltip({
        content: function() {
            return $(this).prop('title');
        },
        show: null,
        close: function(event, ui) {
            ui.tooltip.hover(
            function() {
                $(this).stop(true).fadeTo(400, 1);
            },
            function() {
                $(this).fadeOut("400", function() {
                    $(this).remove();
                })
            });
        }
      });
    }

}

export {AnnoCddSite}

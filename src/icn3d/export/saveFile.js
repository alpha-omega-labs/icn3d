/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

import {HashUtilsCls} from '../../utils/hashUtilsCls.js';
import {UtilsCls} from '../../utils/utilsCls.js';
import {ParasCls} from '../../utils/parasCls.js';
import {ConvertTypeCls} from '../../utils/convertTypeCls.js';

import {Html} from '../../html/html.js';

import {Transform} from '../transform/transform.js';
import {ApplyCenter} from '../display/applyCenter.js';
import {Draw} from '../display/draw.js';
import {ShareLink} from '../export/shareLink.js';
import {LineGraph} from '../interaction/lineGraph.js';
import {Resid2spec} from '../selection/resid2spec.js';

class SaveFile {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    //Save the state file or the image file with "filename". "type" is either "text" for state file or "png" for image file.

    //Five types are used: command, png, html, text, and binary. The type "command" is used to save the statefile.
    //The type "png" is used to save the current canvas image. The type "html" is used to save html file with the
    //"data". This can be used to save any text. The type "text" is used to save an array of text, where "data" is
    //actually an array. The type "binary" is used to save an array of binary, where "data" is actually an array.
    saveFile(filename, type, text) {var ic = this.icn3d, me = ic.icn3dui;
        //Save file
        var blob;

        if(type === 'command') {
            var dataStr =(ic.loadCmd) ? ic.loadCmd + '\n' : '';
            for(var i = 0, il = ic.commands.length; i < il; ++i) {
                var command = ic.commands[i].trim();
                if(i == il - 1) {
                   var command_tf = command.split('|||');

                   var transformation = {}
                   transformation.factor = ic._zoomFactor;
                   transformation.mouseChange = ic.mouseChange;
                   transformation.quaternion = ic.quaternion;

                   command = command_tf[0] + '|||' + ic.transformCls.getTransformationStr(transformation);
                }

                dataStr += command + '\n';
            }
            var data = decodeURIComponent(dataStr);

            blob = new Blob([data],{ type: "text;charset=utf-8;"});
        }
        else if(type === 'png') {
            //ic.scaleFactor = 1.0;
            var width = $("#" + ic.pre + "canvas").width();
            var height = $("#" + ic.pre + "canvas").height();
            ic.applyCenterCls.setWidthHeight(width, height);

            if(ic.bRender) ic.drawCls.render();

            var bAddURL = true;
            if(!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                bAddURL = false;
            }

            if(me.utilsCls.isIE()) {
                blob = ic.renderer.domElement.msToBlob();

                if(bAddURL) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var arrayBuffer = e.target.result; // or = reader.result;

                        var text = ic.shareLinkCls.getPngText();

                        blob = me.convertTypeCls.getBlobFromBufferAndText(arrayBuffer, text);

                        //if(window.navigator.msSaveBlob) navigator.msSaveBlob(blob, filename);
                        saveAs(blob, filename);

                        return;
                    }

                    reader.readAsArrayBuffer(blob);
                }
                else {
                    //ic.createLinkForBlob(blob, filename);
                    saveAs(blob, filename);

                    return;
                }
            }
            else {
                ic.renderer.domElement.toBlob(function(data) {
                    if(bAddURL) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var arrayBuffer = e.target.result; // or = reader.result;

                            var text = ic.shareLinkCls.getPngText();

                            blob = me.convertTypeCls.getBlobFromBufferAndText(arrayBuffer, text);

                            //ic.createLinkForBlob(blob, filename);
                            saveAs(blob, filename);

                            return;
                        }

                        reader.readAsArrayBuffer(data);
                    }
                    else {
                        blob = data;

                        //ic.createLinkForBlob(blob, filename);
                        saveAs(blob, filename);

                        return;
                    }
                });
            }

            // reset the image size
            ic.scaleFactor = 1.0;
            ic.applyCenterCls.setWidthHeight(width, height);

            if(ic.bRender) ic.drawCls.render();
        }
        else if(type === 'html') {
            var dataStr = text;
            var data = decodeURIComponent(dataStr);

            blob = new Blob([data],{ type: "text/html;charset=utf-8;"});
        }
        else if(type === 'text') {
            //var dataStr = text;
            //var data = decodeURIComponent(dataStr);

            //blob = new Blob([data],{ type: "text;charset=utf-8;"});

            var data = text; // here text is an array of text

            blob = new Blob(data,{ type: "text;charset=utf-8;"});
        }
        else if(type === 'binary') {
            var data = text; // here text is an array of blobs

            //blob = new Blob([data],{ type: "application/octet-stream"});
            blob = new Blob(data,{ type: "application/octet-stream"});
        }

        if(type !== 'png') {
            //https://github.com/eligrey/FileSaver.js/
            saveAs(blob, filename);
        }
    }

    saveSvg(id, filename) { var ic = this.icn3d, me = ic.icn3dui;
        var svg = this.getSvgXml(id);

        var blob = new Blob([svg], {type: "image/svg+xml"});
        saveAs(blob, filename);
    }

    getSvgXml(id) { var ic = this.icn3d, me = ic.icn3dui;
        if(ic.icn3dui.bNode) return '';

        // font is not good
        var svg_data = document.getElementById(id).innerHTML; //put id of your svg element here

        var head = "<svg title=\"graph\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">";

        //if you have some additional styling like graph edges put them inside <style> tag
        var style = "<style>text {font-family: sans-serif; font-weight: bold; font-size: 18px;}</style>";

        var full_svg = head +  style + svg_data + "</svg>"

        return full_svg;
    }

    savePng(id, filename, width, height) { var ic = this.icn3d, me = ic.icn3dui;
        if(ic.icn3dui.bNode) return '';

        // https://stackoverflow.com/questions/3975499/convert-svg-to-image-jpeg-png-etc-in-the-browser
        var svg = document.getElementById(id);
        var bbox = svg.getBBox();

        var copy = svg.cloneNode(true);
        ic.lineGraphCls.copyStylesInline(copy, svg);
        var canvas = document.createElement("CANVAS");
        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, bbox.width, bbox.height);

        var data = this.getSvgXml(id); //(new XMLSerializer()).serializeToString(copy); //ic.saveFileCls.getSvgXml();
        var DOMURL = window.URL || window.webkitURL || window;
        var svgBlob = new Blob([data], {type: "image/svg+xml;charset=utf-8"});

        var img = new Image();
        img.src = DOMURL.createObjectURL(svgBlob);

        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(this.src);

            if(me.utilsCls.isIE()) {
                var blob = canvas.msToBlob();

                saveAs(blob, filename);

                canvas.remove();

                return;
            }
            else {
                canvas.toBlob(function(data) {
                    var blob = data;
                    saveAs(blob, filename);

                    canvas.remove();

                    return;
                });
            }
        }
    }

    exportCustomAtoms() {var ic = this.icn3d, me = ic.icn3dui;
       var html = "";
       var nameArray =(ic.defNames2Residues !== undefined) ? Object.keys(ic.defNames2Residues).sort() : [];
       for(var i = 0, il = nameArray.length; i < il; ++i) {
         var name = nameArray[i];
         var residueArray = ic.defNames2Residues[name];
         var description = ic.defNames2Descr[name];
         var command = ic.defNames2Command[name];
         command = command.replace(/,/g, ', ');
         html += name + "\tselect ";
         html += ic.resid2specCls.residueids2spec(residueArray);
         html += "\n";
       } // outer for
       nameArray =(ic.defNames2Atoms !== undefined) ? Object.keys(ic.defNames2Atoms).sort() : [];
       for(var i = 0, il = nameArray.length; i < il; ++i) {
         var name = nameArray[i];
         var atomArray = ic.defNames2Atoms[name];
         var description = ic.defNames2Descr[name];
         var command = ic.defNames2Command[name];
         command = command.replace(/,/g, ', ');
         var residueArray = ic.resid2specCls.atoms2residues(atomArray);
         if(residueArray.length > 0) {
             html += name + "\tselect ";
             html += ic.resid2specCls.residueids2spec(residueArray);
             html += "\n";
         }
       } // outer for
       return html;
    }

    //getAtomPDB: function(atomHash, bPqr, bPdb, bNoChem) { var ic = this.icn3d, me = ic.icn3dui;
    getAtomPDB(atomHash, bPqr, bNoChem) { var ic = this.icn3d, me = ic.icn3dui;
        var pdbStr = '';

        // get all phosphate groups in lipids
        var phosPHash = {}, phosOHash = {}
        for(var i in ic.chemicals) {
            var atom = ic.atoms[i];
            if(atom.elem == 'P') {
                phosPHash[i] = 1;

                for(var j = 0, jl = atom.bonds.length; j < jl; ++j) {
                    var serial = atom.bonds[j];
                    if(serial && ic.atoms[serial].elem == 'O') { // could be null
                        phosOHash[serial] = 1;
                    }
                }
            }
        }
    /*
    HELIX    1  NT MET A    3  ALA A   12  1                                  10
            var startChain =(line.substr(19, 1) == ' ') ? 'A' : line.substr(19, 1);
            var startResi = parseInt(line.substr(21, 4));
            var endResi = parseInt(line.substr(33, 4));
    SHEET    1  B1 2 GLY A  35  THR A  39  0
            var startChain =(line.substr(21, 1) == ' ') ? 'A' : line.substr(21, 1);
            var startResi = parseInt(line.substr(22, 4));
            var endResi = parseInt(line.substr(33, 4));
    */

        var calphaHash = me.hashUtilsCls.intHash(atomHash, ic.calphas);
        var helixStr = 'HELIX', sheetStr = 'SHEET';
        var bHelixBegin = false, bHelixEnd = true;
        var bSheetBegin = false, bSheetEnd = true;

        for(var i in calphaHash) {
            var atom = ic.atoms[i];

            if(atom.ssbegin) {
                if(atom.ss == 'helix') {
                    bHelixBegin = true;
                    if(bHelixEnd) pdbStr += helixStr.padEnd(15, ' ') + atom.resn.padStart(3, ' ') + atom.chain.padStart(2, ' ')
                        + atom.resi.toString().padStart(5, ' ');
                    bHelixEnd = false;
                }
                else if(atom.ss == 'sheet') {
                    bSheetBegin = true;
                    if(bSheetEnd) pdbStr += sheetStr.padEnd(17, ' ') + atom.resn.padStart(3, ' ') + atom.chain.padStart(2, ' ')
                        + atom.resi.toString().padStart(4, ' ');
                    bSheetEnd = false;
                }
            }

            if(atom.ssend) {
                if(atom.ss == 'helix') {
                    bHelixEnd = true;
                    if(bHelixBegin) pdbStr += atom.resn.padStart(5, ' ') + atom.chain.padStart(2, ' ')
                        + atom.resi.toString().padStart(5, ' ') + '\n';
                    bHelixBegin = false;
                }
                else if(atom.ss == 'sheet') {
                    bSheetEnd = true;
                    if(bSheetBegin) pdbStr += atom.resn.padStart(5, ' ') + atom.chain.padStart(2, ' ')
                        + atom.resi.toString().padStart(4, ' ') + '\n';
                    bSheetBegin = false;
                }
            }
        }

        var connStr = '';
        var struArray = Object.keys(ic.structures);
        var bMulStruc =(struArray.length > 1) ? true : false;

        var molNum = 1, prevStru = '';
        pdbStr += '\n';
        for(var i in atomHash) {
            var atom = ic.atoms[i];

            // remove chemicals
            if(bNoChem && atom.het) continue;

            if(bMulStruc && atom.structure != prevStru) {
                pdbStr += connStr;
                connStr = '';

                if(molNum > 1)  pdbStr += 'ENDMDL\n';
                pdbStr += 'MODEL        ' + molNum + '\n';
                prevStru = atom.structure;
                ++molNum;
            }

            var line = '';
    /*
    1 - 6 Record name "ATOM "
    7 - 11 Integer serial Atom serial number.
    13 - 16 Atom name Atom name.
    17 Character altLoc Alternate location indicator.
    18 - 20 Residue name resName Residue name.
    22 Character chainID Chain identifier.
    23 - 26 Integer resSeq Residue sequence number.
    27 AChar iCode Code for insertion of residues.
    31 - 38 Real(8.3) x Orthogonal coordinates for X in
    Angstroms.
    39 - 46 Real(8.3) y Orthogonal coordinates for Y in
    Angstroms.
    47 - 54 Real(8.3) z Orthogonal coordinates for Z in
    Angstroms.
    55 - 60 Real(6.2) occupancy Occupancy.
    61 - 66 Real(6.2) tempFactor Temperature factor.
    73 - 76 LString(4) segID Segment identifier, left-justified.
    77 - 78 LString(2) element Element symbol, right-justified.
    79 - 80 LString(2) charge Charge on the atom.
    */
            line +=(atom.het) ? 'HETATM' : 'ATOM  ';
            line += i.toString().padStart(5, ' ');
            line += ' ';

            var atomName = atom.name.trim();
            if(!isNaN(atomName.substr(0, 1)) ) atomName = atomName.substr(1) + atomName.substr(0, 1);

            if(atomName.length == 4) {
                line += atomName;
            }
            else {
                line += ' ';
                atomName = atomName.replace(/\*/g, "'");
                if(atomName == 'O1P') atomName = 'OP1';
                else if(atomName == 'O2P') atomName = 'OP2';
                else if(atomName == 'C5M') atomName = 'C7 ';
                line += atomName.padEnd(3, ' ');
            }

            line += ' ';
            var resn = atom.resn;
    /*
            // add "D" in front of nucleotide residue names
            if(resn == 'A') resn = 'DA';
            else if(resn == 'T') resn = 'DT';
            else if(resn == 'C') resn = 'DC';
            else if(resn == 'G') resn = 'DG';
            else if(resn == 'U') resn = 'DU';
    */

            line +=(resn.length <= 3) ? resn.padStart(3, ' ') : resn.substr(0, 3);
            line += ' ';
            line +=(atom.chain.length <= 1) ? atom.chain.padStart(1, ' ') : atom.chain.substr(0, 1);
            var resi = atom.resi;
            if(atom.chain.length > 3 && !isNaN(atom.chain.substr(3)) ) { // such as: chain = NAG2, resi=1 => chain = NAG, resi=2
                resi = resi - 1 + parseInt(atom.chain.substr(3));
            }
            line +=(resi.toString().length <= 4) ? resi.toString().padStart(4, ' ') : resi.toString().substr(0, 4);
            line += ' '.padStart(4, ' ');
            line += atom.coord.x.toFixed(3).toString().padStart(8, ' ');
            line += atom.coord.y.toFixed(3).toString().padStart(8, ' ');
            line += atom.coord.z.toFixed(3).toString().padStart(8, ' ');

            //if((bPqr && atom.het) ||(phosPHash.hasOwnProperty(i) && !bPdb) ||(phosOHash.hasOwnProperty(i) && !bPdb) ) {
            if((bPqr && atom.het) ||(phosPHash.hasOwnProperty(i)) ||(phosOHash.hasOwnProperty(i)) ) {
                var size = 1.5, charge = 0;

    /*
                // use antechamber atom size
                if(atom.elem == 'C') size = 1.7; //1.9080;
                else if(atom.elem == 'N') size = 1.55; //1.8240;
                else if(atom.elem == 'O') size = 1.52; //1.6612;
                else if(atom.elem == 'H') size = 1.2; //1.2500;
                else if(atom.elem == 'S') size = 1.8; //2.0000;
                else if(atom.elem == 'P') size = 1.8; //2.1000;
                else if(me.parasCls.vdwRadii.hasOwnProperty(atom.elem)) {
                    size = me.parasCls.vdwRadii[atom.elem];
                }
    */

                // use amber atom size
                if(atom.elem == 'C') size = 1.9080;
                else if(atom.elem == 'N') size = 1.8240;
                else if(atom.elem == 'O') size = 1.6612;
                else if(atom.elem == 'H') size = 1.2500;
                else if(atom.elem == 'S') size = 2.0000;
                else if(atom.elem == 'P') size = 2.1000;
                else if(me.parasCls.vdwRadii.hasOwnProperty(atom.elem)) {
                    size = me.parasCls.vdwRadii[atom.elem];
                }

                if(ic.icn3dui.cfg.cid !== undefined && atom.crg !== undefined) {
                    charge = atom.crg;
                }
                else if(phosPHash.hasOwnProperty(i)) {
                    charge = 1.3800; // P in phosphate
                }
                else if(phosOHash.hasOwnProperty(i)) {
                    charge = -0.5950; // O in phosphate
                }
                else if(me.parasCls.ionCharges.hasOwnProperty(atom.elem)) {
                    charge = me.parasCls.ionCharges[atom.elem];
                }

                line += charge.toFixed(4).toString().padStart(8, ' ');
                line += size.toFixed(4).toString().padStart(7, ' ');
            }
            else {
                line += "1.00".padStart(6, ' ');
                line +=(atom.b) ? parseFloat(atom.b).toFixed(2).toString().padStart(6, ' ') : ' '.padStart(6, ' ');
                line += ' '.padStart(10, ' ');
                line += atom.elem.padStart(2, ' ');
                line += ' '.padStart(2, ' ');
            }

            // connection info
            if(atom.het && atom.bonds.length > 0) {
                connStr += 'CONECT' + i.toString().padStart(5, ' ');
                var bondHash = {}
                for(var j = 0, jl = atom.bonds.length; j < jl; ++j) {
                    if(atom.bonds[j] && !bondHash.hasOwnProperty(atom.bonds[j])) { // could be null
                        connStr += atom.bonds[j].toString().padStart(5, ' ');
                        bondHash[atom.bonds[j]] = 1;
                    }
                }
                connStr += '\n';
            }

            pdbStr += line + '\n';
        }

        pdbStr += connStr;

        if(bMulStruc) pdbStr += 'ENDMDL\n';

        return pdbStr;
    }

    getSelectedResiduePDB() { var ic = this.icn3d, me = ic.icn3dui;
       var pdbStr = '';
       pdbStr += this.getPDBHeader();

       var atoms = me.hashUtilsCls.intHash(ic.dAtoms, ic.hAtoms);
       pdbStr += this.getAtomPDB(atoms);

       return pdbStr;
    }
    getPDBHeader(struNum) { var ic = this.icn3d, me = ic.icn3dui;
       if(struNum === undefined) struNum = 0;

       var pdbStr = '';
       pdbStr += 'HEADER    PDB From iCn3D'.padEnd(62, ' ') + Object.keys(ic.structures)[struNum] + '\n';
       var title =(ic.molTitle.length > 50) ? ic.molTitle.substr(0,47) + '...' : ic.molTitle;
       // remove quotes
       if(title.indexOf('"') != -1) title = '';
       pdbStr += 'TITLE     ' + title + '\n';

       return pdbStr;
    }

    //Show the title and PDB ID of the PDB structure at the beginning of the viewer.
    showTitle() {var ic = this.icn3d, me = ic.icn3dui;
        if(ic.molTitle !== undefined && ic.molTitle !== '') {
            var title = ic.molTitle;

            var titlelinkColor =(ic.opts['background'] == 'white' || ic.opts['background'] == 'grey') ? 'black' : ic.icn3dui.htmlCls.GREYD;

            if(ic.inputid === undefined) {
                if(ic.molTitle.length > 40) title = ic.molTitle.substr(0, 40) + "...";

                $("#" + ic.pre + "title").html(title);
            }
            else if(ic.icn3dui.cfg.cid !== undefined) {
                var url = this.getLinkToStructureSummary();

                $("#" + ic.pre + "title").html("PubChem CID <a id='" + ic.pre + "titlelink' href='" + url + "' style='color:" + titlelinkColor + "' target='_blank'>" + ic.inputid.toUpperCase() + "</a>: " + title);
            }
            else if(ic.icn3dui.cfg.align !== undefined) {
                $("#" + ic.pre + "title").html(title);
            }
            else if(ic.icn3dui.cfg.chainalign !== undefined) {
                var chainidArray = ic.icn3dui.cfg.chainalign.split(',');
                title = 'Dynamic Structure Alignment of Chain ' + chainidArray[0] + ' to Chain ' + chainidArray[1];

                $("#" + ic.pre + "title").html(title);
            }
            else {
                var url = this.getLinkToStructureSummary();

                if(ic.molTitle.length > 40) title = ic.molTitle.substr(0, 40) + "...";

                //var asymmetricStr =(ic.bAssemblyUseAsu) ? "(Asymmetric Unit)" : "";
                var asymmetricStr = "";

                $("#" + ic.pre + "title").html("PDB ID <a id='" + ic.pre + "titlelink' href='" + url + "' style='color:" + titlelinkColor + "' target='_blank'>" + ic.inputid.toUpperCase() + "</a>" + asymmetricStr + ": " + title);
            }
        }
        else {
            $("#" + ic.pre + "title").html("");
        }
    }

    getLinkToStructureSummary(bLog) {var ic = this.icn3d, me = ic.icn3dui;
       var url = "https://www.ncbi.nlm.nih.gov/structure/?term=";

       if(ic.icn3dui.cfg.cid !== undefined) {
           url = "https://www.ncbi.nlm.nih.gov/pccompound/?term=";
       }
       else {
           //if(ic.inputid.indexOf(",") !== -1) {
           if(Object.keys(ic.structures).length > 1) {
               url = "https://www.ncbi.nlm.nih.gov/structure/?term=";
           }
           else {
               //url = "https://www.ncbi.nlm.nih.gov/Structure/mmdb/mmdbsrv.cgi?uid=";
               url = ic.icn3dui.htmlCls.baseUrl + "pdb/";
           }
       }

       if(ic.inputid === undefined) {
           url = "https://www.ncbi.nlm.nih.gov/pccompound/?term=" + ic.molTitle;
       }
       else {
           var idArray = ic.inputid.split('_');

           if(idArray.length === 1) {
               url += ic.inputid;
               if(bLog) ic.icn3dui.htmlCls.clickMenuCls.setLogCmd("link to Structure Summary " + ic.inputid + ": " + url, false);
           }
           else if(idArray.length === 2) {
               url += idArray[0] + " OR " + idArray[1];
               if(bLog) ic.icn3dui.htmlCls.clickMenuCls.setLogCmd("link to structures " + idArray[0] + " and " + idArray[1] + ": " + url, false);
           }
       }

       return url;
    }

    setEntrezLinks(db) {var ic = this.icn3d, me = ic.icn3dui;
      var structArray = Object.keys(ic.structures);
      var url;
      if(structArray.length === 1) {
          url = "https://www.ncbi.nlm.nih.gov/" + db + "/?term=" + structArray[0];
          ic.icn3dui.htmlCls.clickMenuCls.setLogCmd("Entrez " + db + " about PDB " + structArray[0] + ": " + url, false);
          window.open(url, '_blank');
      }
      else if(structArray.length === 2) {
          url = "https://www.ncbi.nlm.nih.gov/" + db + "/?term=" + structArray[0] + " OR " + structArray[1];
          ic.icn3dui.htmlCls.clickMenuCls.setLogCmd("Entrez " + db + " about PDB " + structArray[0] + " OR " + structArray[1] + ": " + url, false);
          window.open(url, '_blank');
      }
    }
}

export {SaveFile}

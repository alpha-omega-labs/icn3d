/**
 * @author Jack Lin, modified from https://github.com/lh3/bioseq-js/blob/master/bioseq.js
 */

//import { HashUtilsCls } from '../../utils/hashUtilsCls.js';

//import { Html } from '../../html/html.js';

//import { SaveFile } from '../export/saveFile.js';
//import { PdbParser } from '../parsers/pdbParser.js';

class AlignSW {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    alignSW(target, query, match_score, mismatch, gap, extension, is_local = false) { let ic = this.icn3d, me = ic.icn3dui;
        //let time_start = new Date().getTime();

        let rst = this.bsa_align(is_local, target, query, [match_score, mismatch], [gap, extension]);
        let str = 'score: ' + rst[0] + '\n';
        str += 'start: ' + rst[1] + '\n';
        str += 'cigar: ' + this.bsa_cigar2str(rst[2]) + '\n\n';
        str += 'alignment:\n\n';
        let fmt = this.bsa_cigar2gaps(target, query, rst[1], rst[2]);

/*
        //let anno_seq = document.getElementById("div0_dl_annotations")
        let algn = "<div id=waterman_alignment><span>" + 'score: ' + rst[0] + '<br>' + 'start: ' + rst[1] + '<br>' + 'cigar: ' + this.bsa_cigar2str(rst[2]) + '<br><br>' + 'alignment:' + '<br>'

        let linelen = 100,
            n_lines = 10;
        for (let l = 0; l < fmt[0].length; l += linelen) {
            str += fmt[0].substr(l, linelen) + '\n';
            str += fmt[2].substr(l, linelen) + '\n';
            str += fmt[1].substr(l, linelen) + '\n\n';
            n_lines += 4;
        }

        algn += '<pre>'
        algn += fmt[0] + '<br>';
        algn += fmt[2] + '<br>';
        algn += fmt[1] + '<br><br>';
        algn += '</pre><br>' + "</span></div>"

        //anno_seq.innerHTML += algn

        //let elapse = (new Date().getTime() - time_start) / 1000.0;
        //console.log("in " + elapse.toFixed(3) + "s");
*/
        let algn = {};
        algn.score = rst[0];
        algn.start = rst[1];
        algn.cigar = this.bsa_cigar2str(rst[2]);
        algn.target = fmt[0];
        algn.query = fmt[1];

        return algn;
    }

    /**
     * Encode a sequence string with table
     *
     * @param seq    sequence
     * @param table  encoding table; must be of size 256
     *
     * @return an integer array
     */

    bsg_enc_seq(seq, table) { let ic = this.icn3d, me = ic.icn3dui;
        if (table == null) return null;
        let s = [];
        s.length = seq.length;
        for (let i = 0; i < seq.length; ++i)
            s[i] = table[seq.charCodeAt(i)];
        return s;
    }

    /*
        ks_revcomp(s) { let ic = this.icn3d, me = ic.icn3dui;
            let ks_comp = {'A':'T','C':'G','G':'C','T':'A','M':'K','K':'M','Y':'R','R':'Y','V':'B','B':'V','H':'D','D':'H',
                        'a':'t','c':'g','g':'c','t':'a','m':'k','k':'m','y':'r','r':'y','v':'b','b':'v','h':'d','d':'h'};

            let i, t = '';
            for (i = 0; i < s.length; ++i) {
                let c = s.charAt(s.length - 1 - i);
                let d = ks_comp[c];
                t += d? d : c;
            }
            return t;
        }
    */

    /**************************
     *** Pairwise alignment ***
        **************************/

    /*
        * The following implements local and global pairwise alignment with affine gap
        * penalties. There are two formulations: the Durbin formulation as is
        * described in his book and the Green formulation as is implemented in phrap.
        * The Durbin formulation is easier to understand, while the Green formulation
        * is simpler to code and probably faster in practice.
        *
        * The Durbin formulation is:
        *
        *   M(i,j) = max{M(i-1,j-1)+S(i,j), E(i-1,j-1), F(i-1,j-1)}
        *   E(i,j) = max{M(i-1,j)-q-r, F(i-1,j)-q-r, E(i-1,j)-r}
        *   F(i,j) = max{M(i,j-1)-q-r, F(i,j-1)-r, E(i,j-1)-q-r}
        *
        * where q is the gap open penalty, r the gap extension penalty and S(i,j) is
        * the score between the i-th residue in the row sequence and the j-th residue
        * in the column sequence. Note that the original Durbin formulation disallows
        * transitions between between E and F states, but we allow them here.
        *
        * In the Green formulation, we introduce:
        *
        *   H(i,j) = max{M(i,j), E(i,j), F(i,j)}
        *
        * The recursion becomes:
        *
        *   H(i,j) = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
        *   E(i,j) = max{H(i-1,j)-q, E(i-1,j)} - r
        *   F(i,j) = max{H(i,j-1)-q, F(i,j-1)} - r
        *
        * It is in fact equivalent to the Durbin formulation. In implementation, we
        * calculate the scores in a different order:
        *
        *   H(i,j)   = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
        *   E(i+1,j) = max{H(i,j)-q, E(i,j)} - r
        *   F(i,j+1) = max{H(i,j)-q, F(i,j)} - r
        *
        * i.e. at cell (i,j), we compute E for the next row and F for the next column.
        * Please see inline comments below for details.
        *
        *
        * The following implementation is ported from klib/ksw.c. The original C
        * implementation has a few bugs which have been fixed here. Like the C
        * version, this implementation should be very efficient. It could be made more
        * efficient if we use typed integer arrays such as Uint8Array. In addition,
        * I mixed the local and global alignments together. For performance,
        * it would be preferred to separate them out.
        */

    /**
     * Generate scoring matrix from match/mismatch score
     *
     * @param n     size of the alphabet
     * @param a     match score, positive
     * @param b     mismatch score, negative
     *
     * @return sqaure scoring matrix. The last row and column are zero, for
     * matching an ambiguous residue.
     */
    bsa_gen_score_matrix(n, a, b) { let ic = this.icn3d, me = ic.icn3dui;
        let m = [];
        if (b > 0) b = -b; // mismatch score b should be non-positive
        let i, j;
        for (i = 0; i < n - 1; ++i) {
            m[i] = [];
            for (j = 0; j < n - 1; ++j)
                m[i][j] = i == j ? a : b;
            m[i][j] = 0;
        }
        m[n - 1] = [];
        for (let j = 0; j < n; ++j) m[n - 1][j] = 0;
        return m;
    }

    /**
     * Generate query profile (a preprocessing step)
     *
     * @param _s      sequence in string or post bsg_enc_seq()
     * @param _m      score matrix or [match,mismatch] array
     * @param table   encoding table; must be consistent with _s and _m
     *
     * @return query profile. It is a two-dimensional integer matrix.
     */
    bsa_gen_query_profile(_s, _m, table) { let ic = this.icn3d, me = ic.icn3dui;
        let s = typeof _s == 'string' ? this.bsg_enc_seq(_s, table) : _s;
        let qp = [],
            matrix;
        if (_m.length >= 2 && typeof _m[0] == 'number' && typeof _m[1] == 'number') { // match/mismatch score
            if (table == null) return null;
            let n = typeof table == 'number' ? table : table[table.length - 1] + 1;
            matrix = this.bsa_gen_score_matrix(n, _m[0], _m[1]);
        } else matrix = _m; // _m is already a matrix; FIXME: check if it is really a square matrix!
        for (let j = 0; j < matrix.length; ++j) {
            let qpj, mj = matrix[j];
            qpj = qp[j] = [];
            for (let i = 0; i < s.length; ++i)
                qpj[i] = mj[s[i]];
        }
        return qp;
    }

    /**
     * Local or global pairwise alignemnt
     *
     * @param is_local  perform local alignment
     * @param target    target string
     * @param query     query string or query profile
     * @param matrix    square score matrix or [match,mismatch] array
     * @param gapsc     [gap_open,gap_ext] array; k-length gap costs gap_open+gap_ext*k
     * @param w         bandwidth, disabled by default
     * @param table     encoding table. It defaults to bst_nt5.
     *
     * @return [score,target_start,cigar]. cigar is encoded in the BAM way, where
     * higher 28 bits keeps the length and lower 4 bits the operation in order of
     * "MIDNSH". See bsa_cigar2str() for converting cigar to string.
     */
    bsa_align(is_local, target, query, matrix, gapsc, w, table) { let ic = this.icn3d, me = ic.icn3dui;
        let bst_nt5 = [
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 0, 4, 1, 4, 4, 4, 2, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 0, 4, 1, 4, 4, 4, 2, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,

            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4
        ];

        // convert bases to integers
        if (table == null) table = bst_nt5;
        let t = this.bsg_enc_seq(target, table);
        let qp = this.bsa_gen_query_profile(query, matrix, table);
        let qlen = qp[0].length;

        // adjust band width
        let max_len = qlen > t.length ? qlen : t.length;
        w = w == null || w < 0 ? max_len : w;
        let len_diff = t.target > qlen ? t.target - qlen : qlen - t.target;
        w = w > len_diff ? w : len_diff;

        // set gap score
        let gapo, gape; // these are penalties which should be non-negative
        if (typeof gapsc == 'number') gapo = 0, gape = gapsc > 0 ? gapsc : -gapsc;
        else gapo = gapsc[0] > 0 ? gapsc[0] : -gapsc[0], gape = gapsc[1] > 0 ? gapsc[1] : -gapsc[1];
        let gapoe = gapo + gape; // penalty for opening the first gap

        // initial values
        let NEG_INF = -0x40000000;
        let H = [],
            E = [],
            z = [],
            score, max = 0,
            end_i = -1,
            end_j = -1;
        if (is_local) {
            for (let j = 0; j <= qlen; ++j) H[j] = E[j] = 0;
        } else {
            H[0] = 0;
            E[0] = -gapoe - gapoe;
            for (let j = 1; j <= qlen; ++j) {
                if (j >= w) H[j] = E[j] = NEG_INF; // everything is -inf outside the band
                else H[j] = -(gapoe + gape * (j - 1)), E[j] = -(gapoe + gapoe + gape * j);
            }
        }

        // the DP loop
        for (let i = 0; i < t.length; ++i) {
            let h1 = 0,
                f = 0,
                m = 0,
                mj = -1;
            let zi, qpi = qp[t[i]];
            zi = z[i] = [];
            let beg = i > w ? i - w : 0;
            let end = i + w + 1 < qlen ? i + w + 1 : qlen; // only loop through [beg,end) of the query sequence
            if (!is_local) {
                h1 = beg > 0 ? NEG_INF : -(gapoe + gape * i);
                f = beg > 0 ? NEG_INF : -(gapoe + gapoe + gape * i);
            }
            for (let j = beg; j < end; ++j) {
                // At the beginning of the loop: h=H[j]=H(i-1,j-1), e=E[j]=E(i,j), f=F(i,j) and h1=H(i,j-1)
                // If we only want to compute the max score, delete all lines involving direction "d".
                let e = E[j],
                    h = H[j],
                    d;
                H[j] = h1; // set H(i,j-1) for the next row
                h += qpi[j]; // h = H(i-1,j-1) + S(i,j)
                d = h >= e ? 0 : 1;
                h = h >= e ? h : e;
                d = h >= f ? d : 2;
                h = h >= f ? h : f; // h = H(i,j) = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
                d = !is_local || h > 0 ? d : 1 << 6;
                h1 = h; // save H(i,j) to h1 for the next column
                mj = m > h ? mj : j;
                m = m > h ? m : h; // update the max score in this row
                h -= gapoe;
                h = !is_local || h > 0 ? h : 0;
                e -= gape;
                d |= e > h ? 1 << 2 : 0;
                e = e > h ? e : h; // e = E(i+1,j)
                E[j] = e; // save E(i+1,j) for the next row
                f -= gape;
                d |= f > h ? 2 << 4 : 0;
                f = f > h ? f : h; // f = F(i,j+1)
                zi[j] = d; // z[i,j] keeps h for the current cell and e/f for the next cell
            }
            H[end] = h1, E[end] = is_local ? 0 : NEG_INF;
            if (m > max) max = m, end_i = i, end_j = mj;
        }
        if (is_local && max == 0) return null;
        score = is_local ? max : H[qlen];

        let cigar = [],
            tmp, which = 0,
            i, k, start_i = 0;
        if (is_local) {
            i = end_i, k = end_j;
            if (end_j != qlen - 1) // then add soft cliping
                this.push_cigar(cigar, 4, qlen - 1 - end_j);
        } else i = t.length - 1, k = (i + w + 1 < qlen ? i + w + 1 : qlen) - 1; // (i,k) points to the last cell
        while (i >= 0 && k >= 0) {
            tmp = z[i][k - (i > w ? i - w : 0)];
            which = tmp >> (which << 1) & 3;
            if (which == 0 && tmp >> 6) break;
            if (which == 0) which = tmp & 3;
            if (which == 0) { this.push_cigar(cigar, 0, 1);--i, --k; } // match
            else if (which == 1) { this.push_cigar(cigar, 2, 1);--i; } // deletion
            else { this.push_cigar(cigar, 1, 1), --k; } // insertion
        }
        if (is_local) {
            if (k >= 0) this.push_cigar(cigar, 4, k + 1); // add soft clipping
            start_i = i + 1;
        } else { // add the first insertion or deletion
            if (i >= 0) this.push_cigar(cigar, 2, i + 1);
            if (k >= 0) this.push_cigar(cigar, 1, k + 1);
        }
        for (let i = 0; i < cigar.length >> 1; ++i) // reverse CIGAR
            tmp = cigar[i], cigar[i] = cigar[cigar.length - 1 - i], cigar[cigar.length - 1 - i] = tmp;
        return [score, start_i, cigar];
    }

    // backtrack to recover the alignment/cigar
    push_cigar(ci, op, len) { let ic = this.icn3d, me = ic.icn3dui;
        if (ci.length == 0 || op != (ci[ci.length - 1] & 0xf))
            ci.push(len << 4 | op);
        else ci[ci.length - 1] += len << 4;
    }

    bsa_cigar2gaps(target, query, start, cigar) { let ic = this.icn3d, me = ic.icn3dui;
        let oq = '',
            ot = '',
            mid = '',
            lq = 0,
            lt = start;
        for (let k = 0; k < cigar.length; ++k) {
            let op = cigar[k] & 0xf,
                len = cigar[k] >> 4;
            if (op == 0) { // match
                oq += query.substr(lq, len);
                ot += target.substr(lt, len);
                lq += len, lt += len;
            } else if (op == 1) { // insertion
                oq += query.substr(lq, len);
                ot += Array(len + 1).join("-");
                lq += len;
            } else if (op == 2) { // deletion
                oq += Array(len + 1).join("-");
                ot += target.substr(lt, len);
                lt += len;
            } else if (op == 4) { // soft clip
                lq += len;
            }
        }
        let ut = ot.toUpperCase();
        let uq = oq.toUpperCase();
        for (let k = 0; k < ut.length; ++k)
            mid += ut.charAt(k) == uq.charAt(k) ? '|' : ' ';
        return [ot, oq, mid];
    }

    bsa_cigar2str(cigar) { let ic = this.icn3d, me = ic.icn3dui;
        let s = [];
        for (let k = 0; k < cigar.length; ++k)
            s.push((cigar[k] >> 4).toString() + "MIDNSHP=XB".charAt(cigar[k] & 0xf));
        return s.join("");
    }
}

export { AlignSW }

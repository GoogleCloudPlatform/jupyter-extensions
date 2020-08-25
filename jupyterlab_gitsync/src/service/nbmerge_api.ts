import * as diff3 from 'node-diff3';
import _ from 'lodash';

export function mergeNotebooks(base, local, remote){
  const merged = mergeMetadata(base, local, remote);
  const result = mergeCells(base, local, remote);
  merged.cells = result.value;
  return { content: merged, conflict: result.conflict, source: result.source }
}

function mergeMetadata(base, local, remote){
  // TO DO (ashleyswang): do a proper object merge for metadata
  return base;
}

const cell_divider = '@#$%%^&*!#$&(@%^@%@%@#%$';
function mergeCells(base, local, remote){
  const base_str = getContents(base.cells, cell_divider);
  const local_str = getContents(local.cells, cell_divider);
  const remote_str = getContents(remote.cells, cell_divider);

  /* Merge Source Contents as String */
  let result = diff3.merge(local_str, base_str, remote_str, {stringSeparator: '\n'});
  if (result.conflict){
    result.result = addConflictCells(result);
  }
  const merged_str = result.result.join('\n');

  /* Map to correct cell for metadata */ 
  const merged_source = merged_str.split(cell_divider+'\n');
  const mapping = mapMergedCells(base_str, local_str, remote_str, merged_str);

  /* Using op mapping, get correct metadata */
  let cells = []
  let source = []
  let l = 0, r = 0, m = 0, b=0, i = 0;
  while(i < mapping.length){
    if(mapping[i].op === null){
      let cell = mergeCellMetadata(base.cells[b], local.cells[l], remote.cells[r]);
      cell.source = merged_source[m].substr(0, merged_source[m].length-1).match(/[^\n]+\n?|\n/g);
      cells.push(cell);
      source.push(cell.source);
      l++; r++; m++; b++; 
    } else if (mapping[i].op === 'removed'){
      if (mapping[i].modifier == 'local'){ b++; r++;}
      if (mapping[i].modifier == 'remote'){ b++; l++;}
    } else if (mapping[i].op === 'added'){
      let cell = null;
      if (mapping[i].modifier == 'local'){ cell = local.cells[l]; l++;}
      if (mapping[i].modifier == 'remote'){ cell = remote.cells[r]; r++;}
      delete cell.metadata.trusted;
      cell.source = merged_source[m].substr(0, merged_source[m].length-1).match(/[^\n]+\n?|\n/g);
      cells.push(cell);
      source.push(cell.source);
      m++;
    } else if (mapping[i].op === 'modified'){
      let cell = mergeCellMetadata(base.cells[b], local.cells[l], remote.cells[r]);
      cell.source = merged_source[m].substr(0, merged_source[m].length-1).match(/[^\n]+\n?|\n/g);
      cells.push(cell);
      source.push(cell.source);
      l++; r++; m++; b++;
    } else if (mapping[i].op === 'conflict'){
      let cell = {
        cell_type: "markdown", 
        metadata: {},
        source: [merged_source[m]]
      };
      cells.push(cell);
      source.push(cell.source);
      m++;
    }
    i++;
  }
  return { value: cells, conflict: result.conflict, source: source};
}

function addConflictCells(result){
  let cindex = {local: undefined, divider: undefined, remote: undefined, cell: false};
  let source = result.result;
  source.forEach((value, index) => {
    switch (value){
      case '\n<<<<<<<<<\n':
        cindex = {local: undefined, divider: undefined, remote: undefined, cell: false};
        source[index] = '<<<<<<<<< LOCAL';
        cindex.local = index;
        break;
      case '\n=========\n':
        source[index] = '=========';
        cindex.divider = index;
        break;
      case '\n>>>>>>>>>\n':
        source[index] = '>>>>>>>>> REMOTE';
        cindex.remote = index;
        if (cindex.cell && cindex.local !== undefined && cindex.divider && cindex.remote){ 
          source[cindex.local] = '<span style=\"color:red\"><<<<<<<<< LOCAL</span>' + cell_divider;
          source[cindex.divider] = '<span style=\"color:red\">=========</span>' + cell_divider;
          source[cindex.remote] = '<span style=\"color:red\">>>>>>>>>> REMOTE</span>' + cell_divider;
        }
        break;
      case cell_divider:
        cindex.cell = true;
        break;
      default:
        break;
    }
  });
  return source;
}

function getContents(cells, divider){
  let contents = '';
  for (let i = 0; i<cells.length; i++){
    let cell = cells[i];
    let text = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    
    contents += text + '\n' + divider + '\n';
  }
  return contents;
}

function mapMergedCells(base_str, local_str, remote_str, merged_str){
  const local_diff = diff3.diffComm(base_str.split('\n'), local_str.split('\n'));
  const remote_diff = diff3.diffComm(base_str.split('\n'), remote_str.split('\n'));
  const merged_diff = diff3.diffComm(base_str.split('\n'), merged_str.split('\n'));

  const local_ops = getDiffOps(local_diff);
  const remote_ops = getDiffOps(remote_diff);
  const merged_ops = getDiffOps(merged_diff);

  let mapping = [];
  let modifier = null;
  let l = 0, r = 0, m = 0;
  while(m < merged_ops.length){
    switch(merged_ops[m]){
      case 'removed':
        modifier = (local_ops[l] == 'removed') ? 'local' : 'remote';
        mapping.push({op: 'removed', modifier: modifier});
        break;
      case 'modified':
        modifier = (local_ops[l] == 'modified') ? 'local' : 'remote';
        if (modifier == 'local' && remote_ops[r] == 'modified'){ modifier = 'both'; }
        mapping.push({op: 'modified', modifier: modifier});
        break;
      case 'added':
        modifier = (local_ops[l] == 'added') ? 'local' : 'remote';
        mapping.push({op: 'added', modifier: modifier});
        if (modifier == 'local') { r--; }
        if (modifier == 'remote') { l--; }
        break;
      case 'conflict':  
        mapping.push({op: 'conflict', modifier: null})
        l--; r--;
        break;
      case 'unmodified': 
        mapping.push({op: null, modifier: null});
        break;
    }
    l++; 
    r++;
    m++;
  }
  return mapping;
}

function getDiffOps(diff){
  let ops = [];
  let curr_type = null;

  const diff_arr = diff.flatMap(x => {
    let xmap = []
    if (x.buffer1 && x.buffer1.length){ xmap.push({op: 'removed', value: x.buffer1.join('\n')+'\n'});} 
    if (x.buffer2 && x.buffer2.length){ xmap.push({op: 'added', value: x.buffer2.join('\n')+'\n'});}
    if (x.common){ xmap.push({op: 'unmodified', value: x.common.join('\n')+'\n'});}
    return xmap;
  });

  for (let i=0; i<diff_arr.length; i++){
    let cells = diff_arr[i].value.split(cell_divider + '\n');
    for (let j=0; j<cells.length; j++){
      switch (cells[j]){
        case '<span style=\"color:red\"><<<<<<<<< LOCAL</span>':
        case '<span style=\"color:red\">=========</span>':
        case '<span style=\"color:red\">>>>>>>>>> REMOTE</span>':
          if (diff_arr[i].op == "added"){ 
            curr_type = 'conflict';
            break;
          }
        case '' :
          break;
        default:
          curr_type = joinType(curr_type, diff_arr[i].op);
      }
      if (j!= cells.length -1){
        ops.push(curr_type);
        curr_type = null;
      }
    }
  }
  return ops;
}

function joinType(original, updated){
  if (original === null){
    return updated;
  } else if (original === "unmodified" && updated !== "unmodified"){
    return "modified";
  } else {
    return "modified";
  }
}

function stripCellMetadata(cell){
  let cell_meta = cell;
  cell_meta.source = null;
  delete cell_meta.metadata.trusted;
  return cell_meta;
}

function mergeCellMetadata(base, local, remote){
  const base_meta = stripCellMetadata(base);
  const local_meta = stripCellMetadata(local);
  const remote_meta = stripCellMetadata(remote);

  if(_.isEqual(local_meta, base_meta) && _.isEqual(remote_meta, base_meta)){
    return base_meta;
  } else if (_.isEqual(local_meta, base_meta) && !_.isEqual(remote_meta, base_meta)){
    return remote_meta;
  } else if (!_.isEqual(local_meta, base_meta) && _.isEqual(remote_meta, base_meta)){
    return local_meta;
  } else {
    // TO DO (ashleyswang): implement proper metadata merge for cells 
    return local_meta;
  }
}
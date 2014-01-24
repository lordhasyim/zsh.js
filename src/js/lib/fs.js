var CommandManager = require('./command-manager');

var FS = {};
var FILE_SYSTEM_KEY = 'file_system';

FS.root = JSON.parse(localStorage.getItem(FILE_SYSTEM_KEY)) || require('./file-system.json');
FS.currentPath = FS.home = '/Users/guest';
FS.currentDir = FS.root.Users.guest;

FS.pwd = function (compress, stdout) {
  var pwd = FS.currentPath;

  if (compress === true) {
    pwd = pwd.replace(FS.home, '~');
  }
  
  if (stdout) {
    stdout(pwd);
  } else {
    return pwd;
  }
};
  

FS.translatePath = function (path) {
  var index;

  path = path.replace('~', FS.home);

  if (path[0] !== '/') {
    path = (FS.currentPath !== '/' ? FS.currentPath + '/' : '/') + path;
  }

  path = path.split('/');

  while(~(index = path.indexOf('..'))) {
    path.splice(index-1, 2);
  }

  while(~(index = path.indexOf('.'))) {
    path.splice(index, 1);
  }

  if (path[0] === '.') {
    path.shift();
  }

  if (path.length < 2) {
    path = [,,];
  }

  return path.join('/');
};

FS.realpath = function(path) {
  path = FS.translatePath(path);

  return FS.exists(path) ? path : null;
};


FS.open = function (path) {
  if (path[0] !== '/') {
    path = FS.translatePath(path);
  }

  path = path.substr(1).split('/').filter(String);

  var cwd = FS.root;
  while(path.length && cwd) {
    cwd = cwd[path.shift()];
  }

  return cwd;
};

FS.exists = function (path) {
  return !!FS.open(path);
};

FS.ls = function (args, stdout) {
  var outputs = [];

  if (!args.arguments.length) {
    args.arguments.push('.');
  }

  args.arguments.forEach(function (arg) {
    var dir = FS.open(arg);

    outputs.push({
      path: arg,
      success: !!dir,
      files: dir ? Object.keys(dir).join(' ') : FS.notFound('ls', arg)
    });
  });

  if (outputs.length === 1) {
    stdout(outputs.shift().files);
  } else {
    var out = '';
    outputs.forEach(function (output) {
      out += (output.success ? output.path+':\n' + output.files:output.files) + '\n';
    });
    stdout(out);
  }
};

FS.error = function () {
  return [].join.call(arguments, ': ');
};

FS.notFound = function (cmd, arg) {
  return FS.error(cmd, arg, 'No such file or directory');
};

FS.autocomplete = function (path) {
  path = path.split('/');
  var fileName = path.pop().toLowerCase();
  var parentPath = path.join('/');
  var dir = FS.open(parentPath);
  var options = [];

  if (dir) {
    for (var key in dir) {
      if (key.substr(0, fileName.length).toLowerCase() === fileName) {
        options.push(key);
      }
    }
  }

  return options;
};

FS.cat =  function (args, stdout) {
  var out = [];

  args.arguments.forEach(function (arg) {
    var content = FS.open(arg);

    if (content !== undefined) {
      if (typeof(content) === 'string') {
        out.push(content);
      } else {
        out.push(FS.error('cat', arg, 'Is a directory'));
      }
    } else {
      out.push(FS.notFound('cat', arg));
    }
  });

  stdout(out.join('\n'));
};

FS.writeFS = function () {
  console.log('writing...');
  localStorage.setItem(FILE_SYSTEM_KEY, JSON.stringify(FS.root));
};

CommandManager.register('ls', FS.ls);
CommandManager.register('cd', FS.cd);
CommandManager.register('cat', FS.cat);
CommandManager.register('pwd', FS.pwd);

module.exports = FS;

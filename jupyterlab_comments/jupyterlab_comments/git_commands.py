import subprocess
import json

def run(*args):
	return subprocess.check_output(['git'] + list(args))

def status():
	status = run('status').decode('utf-8')
	print(type(status))
	print(status)

def appraise_pull():
	run('appraise', 'pull', remote)

#Return true if the current directory is a git repo
def inside_git_repo():
	return_code = subprocess.check_call(['git', 'rev-parse'])
	return return_code == 0

def get_all_comments(file_path, remote):
	comments = []
	prev_names = []
	for name in prev_names:
		comments_list = get_comments_for_path(name)


"""
Behavior for git appraise show -d -json <file_path>:
'-d' flag gets detached comments for the provided file path
'-json' flag formats output as json (returns null if no comments attached to the file)
if the file doesn't exist, it just returns that there are no comments attached to the file

Behavior for git appraise comment -d -m "The comment" -f <file_path>
If the file doesn't exist, it gives you an error

Use 'git appraise push' to publish comments to remote repo

File paths are relative to the root of the github repo, not relative to the repository the command is made from
"""
def get_comments_for_path(file_path):
	comments_json = run('appraise', 'show', '-d', 'json', file_path)
	

def add_comment(file_path):
	pass

def get_previous_names(file_path):
	#git log --follow --name-only --pretty=format:"" ${FILENAME}
	names_string = run('log', '--follow', '--name-only', '--pretty=format:""', file_path)
	names_list = []
	return names_list


def test():
	print('Testing git commands invoked using python')
	#status()
	#print(inside_git_repo())

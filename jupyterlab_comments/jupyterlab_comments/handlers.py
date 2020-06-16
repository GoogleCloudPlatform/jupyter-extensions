from notebook.base.handlers import APIHandler
from jupyterlab_comments.git_commands import Git
import json
git = Git() #global instance of connection to git commands

class PreviousNamesHandler(APIHandler):
    def get(self):
    	file_path = self.get_argument('path')
    	self.finish('Load previous names for a file (unimplemented)')

class ReviewCommentsHandler(APIHandler):
    def get(self):
    	file_path = self.get_argument('path')
    	self.finish('List review comments for a file (unimplemented)')


class DetachedCommentsHandler(APIHandler):
    def get(self):
        file_path = self.get_argument('path') #Requires file path as an argument
        comments = git.get_comments_for_path(file_path)
        self.finish(json.dumps(comments))


class AddCommentHandler(APIHandler):
    def post(self):
    	file_path = self.get_argument('path')
    	comment = self.get_argument('comment')
    	self.finish('Add a detached comment for a specific file (unimplemented)')

class VerifyInsideRepoHandler(APIHandler):
    def get(self):
        git = Git()
        if git.inside_git_repo():
            self.finish("Current directory is a git repository.")
        else:
            self.finish("Current directory is NOT a git repository.")

from notebook.base.handlers import APIHandler
from jupyterlab_comments.handlers import *


class HelloWorldHandler(APIHandler):
    def get(self):
        self.finish('Hello, world!')

class PreviousNamesHandler(APIHandler):
    def get(self):
    	file_path = self.get_argument('path')
    	self.finish('Load previous names for file: ' + str(file_path))


class ListCommentsHandler(APIHandler):
    def get(self):
    	file_path = self.get_argument('path')
    	self.finish('List comments for file: ' + str(file_path))

class AddCommentHandler(APIHandler):
    def post(self):
    	file_path = self.get_argument('path')
    	comment = self.get_argument('comment')
    	self.finish('Add comment for file: ' + str(file_path) + ' -- ' + str(comment))
import subprocess
import json
from traitlets.config.configurable import Configurable
from traitlets import Int, Float, Unicode, Bool


class Git(Configurable):
    """
    Remote repository should be configured by the
    user in their Jupyter config file. Default remote is 'origin'
    """
    remote = Unicode(u'origin', config=True)

    def run(self, *args):
        try:
            return subprocess.check_output(['git'] + list(args))
        except subprocess.CalledProcessError as e:
            print("Error invoking git command")
            print(e.output)

    def status(self):
        status = self.run('status').decode('utf-8')
        return status

    def appraise_pull(self):
        self.run('appraise', 'pull', self.remote)

    # Return true if the current directory is a git repository
    def inside_git_repo(self):
        try:
            return_code = subprocess.check_call(['git', 'rev-parse'])
            return return_code == 0
        except Exception as e:
            print("Error invoking git command")
            print(e.output)

    """
    Returns a JSON list where each object corresponds to a commment
    on the given file_path
    Keys of objects returned: timestamp, author, location, description
    """
    def get_comments_for_path(self, file_path):
        if self.inside_git_repo():
            #self.appraise_pull() #pull new comments from remote repo
            comments_string = self.run('appraise', 'show', '-d', '-json', file_path)
            comments_json = json.loads(comments_string)
            comments_list = []
            if comments_json is not None:
                for comment_obj in comments_json:
                    comments_list.append(comment_obj['comment'])
            return comments_list
        else:
            #TODO: notify user that they are not connected to a Git repo
            pass


    def get_code_review_comments(self, file_path):
        """
        1. Use 'git appraise pull' to fetch new comments attached to
        the current code review
        2. Use 'git appraise show' to get the comments JSON object
        3. Parse and return comments
        """
        pass

    def add_comment(self, file_path):
        pass

    def get_previous_names(self, file_path):
        # names_string = run('log', '--follow', '--name-only', '--pretty=format:""', file_path)
        pass

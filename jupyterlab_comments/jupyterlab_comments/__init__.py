from notebook.utils import url_path_join
from jupyterlab_comments.handlers import HelloWorldHandler, DetachedCommentsHandler, VerifyInsideRepoHandler

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    print("The server extension has been loaded")
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    base_url = web_app.settings['base_url']
    hello_route_pattern = url_path_join(base_url, '/hello')
    detached_comments_route_pattern = url_path_join(base_url, '/detachedComments')
    verify_repo_route_pattern = url_path_join(base_url, '/verifyRepo')
    web_app.add_handlers(host_pattern, [
        (hello_route_pattern, HelloWorldHandler),
        (detached_comments_route_pattern, DetachedCommentsHandler),
        (verify_repo_route_pattern, VerifyInsideRepoHandler),
        ])
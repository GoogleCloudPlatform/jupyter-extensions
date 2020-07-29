# Lint as: python3
"""Request handler classes for the extensions."""

import base64
import json
import re
import tornado.gen as gen
import os
import random

from collections import namedtuple
from notebook.base.handlers import APIHandler, app_log

from jupyterlab_cookies.version import VERSION

words = """yawn rose draw wave install plot slope prepare cause glow
macho impinge found society icicle boast capable sophisticated improve
high circle
""".title().split()

def generate_data(num):
  return {
    'words': [{
      'id': i,
      'name': ''.join(random.sample(words,3))
    } for i in range(num)]
  }

class ListHandler(APIHandler):
  """Handles requests for Dummy List of Items."""

  @gen.coroutine
  def post(self, *args, **kwargs):

    try:
      post_body = self.get_json_body()

      self.finish(generate_data(post_body['num_items']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({
        'error':{
          'message': str(e)
          }
        })

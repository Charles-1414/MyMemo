# Copyright (C) 2021 Charles All rights reserved.
# Author: @Charles-1414
# License: GNU General Public License v3.0

from fastapi import FastAPI
import os
import json

class Dict2Obj(object):
    def __init__(self, d):
        for key in d:
            if type(d[key]) is dict:
                data = Dict2Obj(d[key])
                setattr(self, key, data)
            else:
                setattr(self, key, d[key])

config = None
if os.path.exists("./config.json"):
    config_txt = open("./config.json","r").read()
    config = Dict2Obj(json.loads(config_txt))
    
app = FastAPI()
from flask import (
    render_template, 
    Blueprint
)
from TeleSalud import app

base = Blueprint('base', __name__)

@base.route('/')
def index():
    return render_template('index.html')
    #return 'Holass'

from flask_mqtt import Mqtt
from threading import Condition
import json

measured_value = None
mqtt_condition = Condition()

def init_mqtt(app, topic):
    mqtt_client = Mqtt(app)
    
    @mqtt_client.on_connect()
    def handle_connect(client, userdata, flags, rc):
        if rc == 0:
            print('Connected successfully')
            mqtt_client.subscribe(topic)  # subscribe to topic
        else:
            print(f'Bad connection. Code: {rc}')

    @mqtt_client.on_message()
    def handle_mqtt_message(client, userdata, message):
        global measured_value
        data = {
            "topic": message.topic,
            "payload": message.payload.decode()
        }
        print(f'Received message on topic: {data["topic"]} with payload: {data["payload"]}')
        
        if data['payload'] == 'medir':
            print('Measurement request received')
        else:
            try:
                nuevo_valor = json.loads(data['payload'])
                
                with mqtt_condition:
                    measured_value = nuevo_valor
                    mqtt_condition.notify()
                    
            except json.JSONDecodeError:
                print("Error: Payload is not valid JSON")

    return mqtt_client

def wait_for_message(timeout=32):
    global measured_value
    retorno = None

    with mqtt_condition:
        # Borramos cualquier dato viejo antes de esperar
        measured_value = None 
        mqtt_condition.wait(timeout=timeout) 
        retorno = measured_value
        measured_value = None

    return retorno
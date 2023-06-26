import Model from "./Model"

const DataFormat = (text, model, histories = Model.system_message) => {

  return {
    "text": text,
    "action": "noauth",
    "id": "",
    "parentId": "",
    "workspaceId": "",
    "messagePersona": "607e41fe-95be-497e-8e97-010a59b2e2c0",
    "model": model,
    "messages": histories,
    "internetMode": "auto"
  }
}

export default DataFormat
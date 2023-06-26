import { useEffect, useState } from "react";
import API from "../config/Api";
import Model from "../config/Model";
import DataFormat from "../config/Format";
import { Button, Card, Col, Container, FormControl, FormSelect, Row, Spinner } from "react-bootstrap";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from 'remark-gfm'
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/hljs";

const App = () => {
  const [chat, setChat] = useState('')
  const [model, setModel] = useState(Model.gpt4)
  const [history, setHistory] = useState(Model.system_message)
  const [data, setData] = useState(DataFormat(chat, model, history))
  const [content, setContent] = useState('Hello!')
  const [showSpinner, setSpinner] = useState(false)

  useEffect(() => {
    const handleServerSentEvents = () => {
      setChat('')
      setSpinner(true)
      fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          let contents = ''
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          const handleData = (data) => {
            var decodedData = decoder.decode(data, { stream: true });
            contents += decodedData
              .replaceAll('event: start', '')
              .replaceAll('event: message', '')
              .replaceAll('event: end', '')
              .replaceAll('data: {"delta":"', '')
              .replaceAll('"}', '')
              .replaceAll("\n", '')
              .replaceAll('\\"', '"')
              .replaceAll("\\n", "\n")
            if (!contents.includes('Sign up to continue chatting')) {
              setSpinner(false)
              setContent(contents)
            }
          };

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                if (!contents.includes('Sign up to continue chatting'))
                  setHistory(
                    Model.addHistory(history, {
                      role: Model.ROLE_ASSISTANT,
                      content: contents
                    }, {
                      role: Model.ROLE_USER,
                      content: chat
                    })
                  )
                else {
                  setChat(chat)
                  tryAgain(() => setData(DataFormat(chat, model, Model.system_message)))
                }
                return
              }
              handleData(value);
              read();
            });
          };

          read();
        })
        .catch((error) => {
          console.error(error)
        })
    };

    if (chat.length > 0) {
      handleServerSentEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const tryAgain = (task) => {
    console.error('retry request')
    task()
  }

  return (
    <Container className="mt-3 py-3 shadow-lg">
      <Card>
        <Card.Header>
          <h5>ChatGPT Free</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center">
            <Spinner animation="border" role="status" className={showSpinner ? 'd-block' : 'd-none'}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
          <ReactMarkdown children={content} className={!showSpinner ? 'd-block' : 'd-none'} components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  children={String(children).replace(/\n$/, '')}
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                />
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              )
            }
          }} remarkPlugins={[remarkGfm]} />
        </Card.Body>
        <Card.Footer>
          <FormControl as="textarea" rows={2} value={chat} onChange={(e) => setChat(e.target.value)} />
          <Row className="mt-3">
            <Col>
              <FormSelect onChange={(e) => setModel(e.target.value)}>
                <option value={Model.gpt4}>{Model.gpt4}</option>
                <option value={Model.gpt3}>{Model.gpt3}</option>
              </FormSelect>
            </Col>
            <Col>
              <Button className="btn-primary text-center w-100" onClick={() => setData(DataFormat(chat, model, history))}>Kirim</Button>
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    </Container>
  )
}

export default App


export interface PdfReference {
  title: string
  fileUrl: string
  page?: number
  section?: string
  keywords?: string[]
}

export interface Question {
  id: string
  title: string
  topic: string
  questionType: string
  description: string
  imageUrl?: string
  givenCode?: string
  solutionCode?: string
  expectedAnswer: string
  explanation?: string
  rubric: string
  pdfReference?: PdfReference
  maxScore: number
}

const PDF_FILE_URL = '/iot-midterm.pdf'

const pdfRef = (
  section: string,
  keywords: string[],
  page?: number,
): PdfReference => ({
  title: 'IoT 중간고사 강의 PDF',
  fileUrl: PDF_FILE_URL,
  page,
  section,
  keywords,
})

export const questions: Question[] = [
  {
    id: 'midterm-q1',
    title: 'analogRead와 analogWrite 범위 비교',
    topic: 'Arduino Analog I/O',
    questionType: 'short-answer',
    description:
      'analogRead()와 analogWrite()의 값 범위를 비교하고, 두 함수의 차이점을 입력과 출력 관점에서 설명하시오. analogRead(A0)의 결과가 512일 때 analogWrite()에 바로 넣으면 안 되는 이유와 올바른 변환 방법도 함께 쓰시오.',
    expectedAnswer:
      'analogRead()는 아날로그 입력을 10비트 ADC로 읽어 0~1023 값을 반환한다. analogWrite()는 PWM 출력으로 0~255 값을 사용한다. 입력 범위가 출력 범위보다 약 4배 크므로 analogRead 값을 PWM으로 쓰려면 value / 4 또는 map(value, 0, 1023, 0, 255)로 변환한다. 512는 PWM 값 약 128에 해당한다.',
    rubric:
      'analogRead 범위 0~1023, analogWrite 범위 0~255, 입력/출력 차이, PWM 개념, /4 또는 map 변환을 설명하면 만점.',
    pdfReference: pdfRef('아날로그 입력, PWM 출력, analogRead/analogWrite', [
      'analogRead',
      'analogWrite',
      'PWM',
    ], 44),
    maxScore: 100,
  },
  {
    id: 'midterm-q2',
    title: '16을 이용한 2진수 논리 연산',
    topic: 'Binary / Bitwise Operators',
    questionType: 'calculation',
    description:
      '10진수 16을 2진수로 나타내고, 다음 비트 논리 연산의 결과를 2진수와 10진수로 쓰시오.\n\n1. 16 | 3\n2. 16 & 3\n3. 16 >> 2\n4. 16 << 1\n\n각 연산자의 의미도 간단히 설명하시오.',
    expectedAnswer:
      '16은 2진수 10000이다. 3은 00011이다. 16 | 3 = 10011(19), 16 & 3 = 00000(0), 16 >> 2 = 00100(4), 16 << 1 = 100000(32)이다. |는 둘 중 하나라도 1이면 1, &는 둘 다 1일 때만 1, >>는 오른쪽 시프트, <<는 왼쪽 시프트이다.',
    rubric:
      '16의 2진수 표현, 네 연산 결과, 각 비트 연산자의 의미를 정확히 쓰면 만점.',
    pdfReference: pdfRef('2진수와 비트 논리 연산자', [
      '2진수',
      'bitwise',
      'shift',
    ], 96),
    maxScore: 100,
  },
  {
    id: 'midterm-q3',
    title: '디지털 트윈의 의미',
    topic: 'IoT Concept',
    questionType: 'short-answer',
    description:
      '디지털 트윈(Digital Twin)이 무엇인지 설명하고, IoT 센서 데이터가 디지털 트윈에서 어떤 역할을 하는지 예를 들어 서술하시오.',
    expectedAnswer:
      '디지털 트윈은 현실의 물리적 사물, 장치, 공간, 공정 등을 디지털 공간의 가상 모델로 복제하고 실시간 데이터로 상태를 동기화하는 기술이다. IoT 센서는 온도, 습도, 위치, 동작 상태 같은 현장 데이터를 수집해 디지털 모델을 최신 상태로 유지한다.',
    rubric:
      '현실 객체의 가상 복제, 실시간 데이터 연동, IoT 센서의 역할, 활용 예시를 포함하면 만점.',
    pdfReference: pdfRef('IoT 개념과 디지털 트윈', [
      '디지털 트윈',
      'Digital Twin',
      'IoT 센서',
    ], 2),
    maxScore: 100,
  },
  {
    id: 'midterm-q4',
    title: '저항 색띠 값 계산',
    topic: 'Electronics Basics',
    questionType: 'calculation',
    imageUrl: '/resistor.png',
    description:
      '아래 사진에 보이는 저항의 색띠를 왼쪽에서 오른쪽으로 읽고, 이 저항이 몇 Ω인지 계산하시오. 허용 오차와 계산 과정도 함께 설명하시오.',
    expectedAnswer:
      '갈색은 1, 검정은 0, 빨강은 곱셈값 10^2, 금색은 허용 오차 ±5%이다. 따라서 저항값은 10 × 100 = 1000Ω = 1kΩ이고 허용 오차는 ±5%이다.',
    rubric:
      '첫째/둘째 색띠 숫자, 셋째 색띠 승수, 넷째 색띠 허용 오차를 적용해 1kΩ ±5%를 계산하면 만점.',
    pdfReference: pdfRef('전기 기초와 저항 계산', [
      '저항',
      '색띠',
      '옴의 법칙',
    ], 35),
    maxScore: 100,
  },
  {
    id: 'midterm-q7',
    title: 'NPN 트랜지스터 설명',
    topic: 'Transistor',
    questionType: 'short-answer',
    description:
      '트랜지스터의 역할을 설명하고, NPN 트랜지스터에서 베이스, 컬렉터, 이미터가 어떤 역할을 하는지 서술하시오. Arduino로 LED나 모터를 제어할 때 트랜지스터를 사용하는 이유도 포함하시오.',
    expectedAnswer:
      '트랜지스터는 작은 신호로 큰 전류를 제어하는 스위치 또는 증폭 소자이다. NPN에서는 베이스에 충분한 전류/전압이 들어오면 컬렉터에서 이미터 방향으로 전류가 흐르며 부하가 동작한다. Arduino 핀은 큰 전류를 직접 공급하기 어렵기 때문에 LED 여러 개, 모터, 릴레이 같은 부하를 제어할 때 트랜지스터를 스위치처럼 사용한다.',
    rubric:
      '트랜지스터의 스위치/증폭 역할, NPN 동작, 베이스/컬렉터/이미터 역할, Arduino 부하 제어 이유를 포함하면 만점.',
    pdfReference: pdfRef('트랜지스터와 NPN 스위치', [
      '트랜지스터',
      'NPN',
      '베이스',
    ], 128),
    maxScore: 100,
  },
  {
    id: 'midterm-q8',
    title: 'Pull-up, Pull-down, Floating 설명',
    topic: 'Digital Input',
    questionType: 'short-answer',
    description:
      '디지털 입력 회로에서 floating 상태가 무엇인지 설명하고, pull-up 저항과 pull-down 저항이 각각 어떤 기본 입력값을 만들기 위해 사용되는지 서술하시오. Arduino의 INPUT_PULLUP 사용 시 버튼을 누르지 않았을 때와 눌렀을 때의 digitalRead 값도 쓰시오.',
    expectedAnswer:
      'Floating은 입력 핀이 HIGH나 LOW에 안정적으로 연결되지 않아 값이 흔들리는 상태이다. Pull-up은 입력을 기본 HIGH로 만들고 버튼을 누르면 LOW가 되게 구성한다. Pull-down은 입력을 기본 LOW로 만들고 버튼을 누르면 HIGH가 되게 구성한다. INPUT_PULLUP은 버튼을 누르지 않으면 HIGH, 누르면 LOW가 읽힌다.',
    rubric:
      'floating의 불안정성, pull-up 기본 HIGH, pull-down 기본 LOW, INPUT_PULLUP의 HIGH/LOW 반전 동작을 설명하면 만점.',
    pdfReference: pdfRef('버튼 입력, Pull-up/Pull-down, Floating', [
      'pull-up',
      'pull-down',
      'floating',
      'INPUT_PULLUP',
    ], 71),
    maxScore: 100,
  },
  {
    id: 'midterm-q9',
    title: '함수의 종류 - 사용자 정의 함수와 라이브러리 함수',
    topic: 'Programming Basics',
    questionType: 'short-answer',
    description:
      '프로그래밍에서 함수의 종류를 사용자 정의 함수와 라이브러리 함수로 나누어 설명하고, Arduino 예시를 각각 2개 이상 제시하시오.',
    expectedAnswer:
      '사용자 정의 함수는 개발자가 필요한 기능을 직접 이름 붙여 만든 함수이다. 예: void turnOnLed(), int readAverageSensor(). 라이브러리 함수는 언어나 라이브러리에서 미리 제공하는 함수이다. Arduino 예: pinMode(), digitalWrite(), analogRead(), delay(), map().',
    rubric:
      '사용자 정의 함수와 라이브러리 함수의 차이, 각 함수의 정의, Arduino 예시를 정확히 제시하면 만점.',
    pdfReference: pdfRef('함수와 Arduino 기본 함수', [
      '함수',
      '사용자 정의 함수',
      '라이브러리 함수',
    ], 114),
    maxScore: 100,
  },
  {
    id: 'midterm-q10',
    title: 'IoT 핵심기술 3가지',
    topic: 'IoT Core Technologies',
    questionType: 'short-answer',
    description:
      'IoT를 구성하는 핵심기술 3가지를 쓰고 각각의 역할을 설명하시오. 단순 나열이 아니라 센서 데이터가 서비스로 이어지는 흐름이 드러나게 작성하시오.',
    expectedAnswer:
      '대표적인 핵심기술은 센싱 기술, 네트워크/통신 기술, 데이터 처리 및 서비스 기술이다. 센싱 기술은 현실 데이터를 수집하고, 통신 기술은 데이터를 서버나 다른 장치로 전달하며, 데이터 처리 및 서비스 기술은 수집 데이터를 저장, 분석, 시각화하고 자동 제어 또는 알림 서비스로 연결한다.',
    rubric:
      '센싱, 통신, 데이터 처리/서비스를 제시하고 각 역할과 데이터 흐름을 설명하면 만점.',
    pdfReference: pdfRef('IoT 핵심 기술', [
      'IoT 핵심기술',
      '센싱',
      '네트워크',
    ], 2),
    maxScore: 100,
  },
  {
    id: 'midterm-q12',
    title: '함수의 의미와 장점',
    topic: 'Programming Basics',
    questionType: 'short-answer',
    description:
      '함수의 의미를 설명하고, 함수를 사용했을 때의 장점을 3가지 이상 서술하시오. Arduino 코드에서 반복되는 LED 제어 코드를 함수로 분리하는 상황을 예로 들어 설명하시오.',
    expectedAnswer:
      '함수는 특정 작업을 수행하는 코드 묶음이며 이름을 통해 호출할 수 있다. 장점은 코드 재사용, 중복 감소, 가독성 향상, 유지보수 용이, 오류 범위 축소 등이다. 반복되는 LED 제어 코드를 blinkLed(pin, onTime, offTime) 같은 함수로 분리하면 여러 핀에서 같은 동작을 쉽게 재사용할 수 있다.',
    rubric:
      '함수의 정의, 호출 개념, 재사용/중복 감소/가독성/유지보수 등 장점 3가지 이상, Arduino 예시를 포함하면 만점.',
    pdfReference: pdfRef('함수의 의미와 장점', [
      '함수',
      '재사용',
      '중복 감소',
    ], 114),
    maxScore: 100,
  },
  {
    id: 'midterm-q5',
    title: '버튼으로 7세그먼트 숫자 순환 표시',
    topic: '7-Segment / Button',
    questionType: 'code-writing',
    description:
      '단일 7세그먼트(1자리)와 버튼을 이용하여 버튼을 누를 때마다 숫자가 0, 1, 2, ... 9, 0 순서로 순환 표시되도록 Arduino 프로그램을 작성하시오.\n\n조건:\n- 7세그먼트 핀 배열은 a,b,c,d,e,f,g 순서로 2,3,4,5,6,7,8번 핀에 연결한다.\n- 버튼은 9번 핀에 연결하고 INPUT_PULLUP을 사용한다.\n- 버튼은 눌림 상태가 LOW일 때만 입력된 것으로 처리한다.\n- 버튼을 계속 누르고 있을 때 숫자가 빠르게 여러 번 증가하지 않도록 눌리는 순간 한 번만 증가한다.\n- 공통 애노드 방식이라고 가정하여 켜야 하는 세그먼트에는 LOW, 꺼야 하는 세그먼트에는 HIGH를 출력한다.',
    givenCode:
      'int segPins[7] = {2, 3, 4, 5, 6, 7, 8};\nint buttonPin = 9;\nint count = 0;\nint lastButton = HIGH;\n\nvoid setup() {\n  // 핀 설정 작성\n}\n\nvoid loop() {\n  // 버튼 눌림 순간에 count 증가\n  // 현재 count를 7세그먼트에 표시\n}',
    solutionCode:
      'int segPins[7] = {2, 3, 4, 5, 6, 7, 8};\nint buttonPin = 9;\nint count = 0;\nint lastButton = HIGH;\n\nbyte digits[10][7] = {\n  {0, 0, 0, 0, 0, 0, 1},\n  {1, 0, 0, 1, 1, 1, 1},\n  {0, 0, 1, 0, 0, 1, 0},\n  {0, 0, 0, 0, 1, 1, 0},\n  {1, 0, 0, 1, 1, 0, 0},\n  {0, 1, 0, 0, 1, 0, 0},\n  {0, 1, 0, 0, 0, 0, 0},\n  {0, 0, 0, 1, 1, 1, 1},\n  {0, 0, 0, 0, 0, 0, 0},\n  {0, 0, 0, 0, 1, 0, 0}\n};\n\nvoid setup() {\n  for (int i = 0; i < 7; i++) {\n    pinMode(segPins[i], OUTPUT);\n  }\n  pinMode(buttonPin, INPUT_PULLUP);\n}\n\nvoid loop() {\n  int button = digitalRead(buttonPin);\n\n  if (lastButton == HIGH && button == LOW) {\n    count = (count + 1) % 10;\n    delay(50);\n  }\n\n  displayNumber(count);\n  lastButton = button;\n}\n\nvoid displayNumber(int number) {\n  for (int i = 0; i < 7; i++) {\n    digitalWrite(segPins[i], digits[number][i] == 0 ? LOW : HIGH);\n  }\n}',
    expectedAnswer:
      '세그먼트 숫자 패턴 배열을 만들고 버튼 핀을 INPUT_PULLUP으로 설정한다. 이전 버튼 상태가 HIGH이고 현재 상태가 LOW인 순간에만 count를 (count + 1) % 10으로 증가시킨다. 현재 count에 해당하는 패턴대로 7세그먼트 핀을 출력한다.',
    rubric:
      '7세그먼트 숫자 패턴 정의, INPUT_PULLUP 사용, LOW 눌림 처리, 눌림 순간 감지, 0~9 순환 카운터, 공통 애노드 출력 논리를 구현하면 만점.',
    pdfReference: pdfRef('7세그먼트 버튼 카운터 예제', [
      '7세그먼트',
      '버튼',
      'INPUT_PULLUP',
    ], 112),
    maxScore: 100,
  },
  {
    id: 'midterm-q6',
    title: 'LED light 예제 손코딩',
    topic: 'LED / Arduino Coding',
    questionType: 'code-writing',
    description:
      'PDF의 LED light 예제를 바탕으로 8번 핀 LED가 1초 켜지고 0.5초 꺼지는 동작을 계속 반복하도록 Arduino 코드를 손코딩하시오.',
    solutionCode:
      'void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(1000);\n  digitalWrite(8, LOW);\n  delay(500);\n}',
    expectedAnswer:
      'setup()에서 8번 핀을 OUTPUT으로 설정하고, loop()에서 digitalWrite(8, HIGH), delay(1000), digitalWrite(8, LOW), delay(500)을 반복한다.',
    rubric:
      'setup/loop 구조, pinMode OUTPUT, digitalWrite HIGH/LOW, delay 1000/500을 정확히 작성하면 만점.',
    pdfReference: pdfRef('LED light / Blink 예제', [
      'LED',
      'Blink',
      'pinMode',
    ], 48),
    maxScore: 100,
  },
  {
    id: 'midterm-q11',
    title: '시리얼 입력으로 서보모터 각도 제어',
    topic: 'Servo / switch-case',
    questionType: 'code-writing',
    description:
      "시리얼 모니터에 문자를 입력하면 서보모터가 지정 각도로 이동하는 Arduino 프로그램을 작성하시오.\n\n조건:\n- Servo 라이브러리를 사용한다.\n- 서보모터는 9번 핀에 연결한다.\n- 시리얼 모니터에 '1'을 입력하면 45도, '2'를 입력하면 90도, '3'을 입력하면 180도로 회전한다.\n- 각도 이동 후 delay(1000)을 실행하고 다시 0도로 이동한다.\n- switch ~ case문을 사용한다.\n- 잘못된 입력은 아무 동작도 하지 않도록 처리한다.",
    givenCode:
      '#include <Servo.h>\n\nServo servo;\n\nvoid setup() {\n  // 서보와 시리얼 초기화\n}\n\nvoid loop() {\n  // Serial 입력을 읽고 switch-case로 각도 제어\n}',
    solutionCode:
      "#include <Servo.h>\n\nServo servo;\n\nvoid setup() {\n  servo.attach(9);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  if (Serial.available() > 0) {\n    char input = Serial.read();\n\n    switch (input) {\n      case '1':\n        moveServo(45);\n        break;\n      case '2':\n        moveServo(90);\n        break;\n      case '3':\n        moveServo(180);\n        break;\n      default:\n        break;\n    }\n  }\n}\n\nvoid moveServo(int angle) {\n  servo.write(angle);\n  delay(1000);\n  servo.write(0);\n}",
    expectedAnswer:
      'Servo.h를 include하고 Servo 객체를 만든다. setup()에서 servo.attach(9), Serial.begin(9600)을 실행한다. loop()에서 Serial.available()을 확인한 후 Serial.read()로 문자를 읽고 switch-case로 1, 2, 3을 구분한다. 각 case에서 45도, 90도, 180도로 이동하고 1초 후 0도로 복귀한다.',
    rubric:
      'Servo 라이브러리 사용, 9번 핀 attach, Serial 입력 처리, switch-case 사용, 1/2/3 입력별 각도, delay 1초 후 0도 복귀를 구현하면 만점.',
    pdfReference: pdfRef('서보모터와 switch-case 예제', [
      'Servo',
      '서보모터',
      'Serial',
    ], 135),
    maxScore: 100,
  },
]

const 
  WIDTH=8,          // Количество квадратов в сетке по ширине
  HEIGHT=8,         // Количество квадратов в сетке по высоте
  WIDTH_BLOCK=32,   // Размер каждой клетки в сетке по ширине
  HEIGHT_BLOCK=32;  // Размер каждой клетки в сетке по высоте

let canvas = document.querySelector("#canvas"),                       //  Получение объекта холста
    images = Array(98).fill(0).map(value => new Image());             //  Создание массива изображений
    images.forEach( (value,index) => {                                //  Пробегаемся по массиву изображений
        images[index].src = "images/png/random/"+(index+1)+".png" //  Устанавливаем путь для каждого png изображения
        // images[index].src = "images/jpg/tanks/"+(index+1)+".jpg" //  Устанавливаем путь для каждого jpg изображения
      }
    );
let context = canvas.getContext("2d"),                                //  Получаем контекст холста
    Ts = [],                                                          //  Инициализируем список входных воздействий
    pixels=[],                                                        //  Инициализация списка попиксельных данных цветов изображения 
    nn={};                                                            //  Инициализация объекта для самоорганизующейся карты
function rnd(min, max) 
{
  /*
    Функция случайного числа в диапазоне min - max
    Аргументы:
    min : тип данных (вещественное) - от какого числа начинается диапазон случайных чисел
    max : тип данных (вещественное) - каким числом заканчивается диапазон случайных чисел
  */
  return ( min + Math.random() * (max - min) ); 
}
function cArr() 
{
  /*
    Наполнение массива примеров обучающей выборки.
  */
  pixels.forEach( (value,indexValue) => {                     //Перебираем изображения
      Ts.push(value.map( (pixel, indexPixel) => pixel / 255)) //Нормализуем значения цветов

    } 
  )
  context.clearRect(0,0,canvas.width,canvas.height)           //Очищаем холст
  
}
class Neuron
{
  /*
    Класс описывающий один нейрон:
    Аргументы:
    X : тип данных (целочисленный) - количество входных воздействий 
    x : тип данных (целочисленный) - координата нейрона по горизонтали
    y : тип данных (целочисленный) - координата нейрона по вертикали  
  */
  constructor(X,x,y)
  {
      this.x=x;                                           // Создаем поле координаты x на холсте
      this.y=y;                                           // Создаем поле координаты y на холсте
      this.w = Array(X).fill(0).map( value=> rnd(0,1) );  // Инициализация весовых коэффициентов
      this.color="rgb(255,255,255)";                      // Инициализация цвета нейрона
  }
  render()
  {
      /*
        Метод осуществляющий отображение нейрона на сетке ввиде квадрата
      */
      context.fillStyle = this.color                              //Установление цвета для отрисовки
      context.clearRect(this.x,this.y,WIDTH_BLOCK,HEIGHT_BLOCK);  //Очистка пространства квадратика на канве
      context.fillRect(this.x,this.y,WIDTH_BLOCK,HEIGHT_BLOCK);   //Прорисовка квадратика на карте
  }
  averageWeights()
  {
    /*
      Метод рассчитывающий среднее значение весовых коэффициентов.
    */
    this.length = this.w.length;              // Получаем количество весов на каждом нейроне
    this.devided =Math.floor(this.w.length/3) // Делим пропорционально веса на три группы
    //  Получаем среднее значение по первой группы для цвета Red
    this.avgR = this.w.slice(0,this.devided).reduce( (accum,value) => accum+value, 0 ) / this.w.length;
    //  Получаем среднее значение по второй группы для цвета Green
    this.avgG = this.w.slice(this.devided,this.devided*2).reduce( (accum,value) => accum+value, 0 ) / this.w.length;
    //  Получаем среднее значение по третьей группы для цвета Blue
    this.avgB = this.w.slice(this.devided*2,this.devided*3).reduce( (accum,value) => accum+value, 0 ) / this.w.length;
  }
  recolor()
  {
    /*
      Метод изменяющий цвет квадратика на карте
    */
    this.averageWeights() //Расчет среднего значения при использовании оттенков серого
    this.color = "rgb("+this.avgR*255+","+this.avgG*255+","+this.avgB*255+")"; //Устанавливаем цвет нейрона на холсте
    this.render()         //Прорисовка нейрона на карте
  }
}
class SOM
{
  /*
    Класс описывающий самоорганизующуюся карту Кохонена
    Аргументы:
    n : тип данных (целочисленный) - количество входных воздействий
  */
  constructor(n)
  {
    this.neurons = [];  //Инициализация массива нейронов
    this.x=1;           //Инициализации координаты x
    this.y=1;           //Инициализации координаты y
    this.sigma0 = Math.max(WIDTH*WIDTH_BLOCK,HEIGHT*HEIGHT_BLOCK)/2; //Константа 
    this.lambda = 0;    //Инициализации ламбда
    this.sigma=0;       //Инициализации сигма
    this.L=0;           //Инициализация коэффициента скорости обучения  
    this.theta = 0;     //Инициализация коэффциента соседства
    this.r = 0;         //Инициализация переменной расстояния до соседнего нейрона
    this.neighbors=[];  //Инициализации массива соседей
    this.classes=[];    //Инициализация массива победивших нейронов
    this.images={};     //Инициализация ассоциативного массива для распределений изображений по нейронам
    for(let i =0; i<= WIDTH*HEIGHT; i++) //Пробегаемся по всем ячейкам сетки
    {
      this.neurons.push(new Neuron(n,this.x,this.y)) //Наполняем массив нейронов экземплярами класса
      if(this.x+WIDTH_BLOCK <= WIDTH*WIDTH_BLOCK)    //Если еще не дошли до правой стенки
      {
        this.x+=WIDTH_BLOCK;                         //Тогда устанавливаем нейрон в данной строке
      }
      else                                           //Иначе 
      {
        this.x=1;                                    //Переходим к левой стенке
        this.y+=HEIGHT_BLOCK;                        //Переходим на новую строку
      }

    }
    this.neurons.forEach( neuron => neuron.render() ) //Прорисовываем все нейроны
  }
  recolor()
  {
    /*
      Метод отображающий текущее состояние карты.
    */
    this.neurons.forEach(value => value.recolor())
  }
  indexMinimum(D)
  {
    /*
      Метод для определения минимального расcтояния между нейронами и входным воздействием
      Аргументы:
      D : тип данных (список) - значения полученные по формуле корня квадратного суммы квадрата разности
    */
    let index=0,min = D[index];    // Устанавливаем первый жлемент списка как минимальный
    for(let i = 1;i<D.length;i++)  // Пробегаемся по всем элементам кроме первого
    {
      if(D[i]<min)                 // Если текущий элемент меньше предыдущего минимума
      {
        index = i;                 // Тогда меняем индекс минимального элемента
        min = D[i];                // Изменяем значение минимального элемента
      }
    }
    return index;                  // Возвращаем индекс минимального элемента
  }
  neuronWinner(y)
  {  
    /*
      Метод для определения нейрона победителя (ближайшего к входному воздействию)
      Аргументы:
      y     : тип данных (список) - входное воздействие
    */
    this.D=[]; //Список для хранения растояний между нейронами и входным воздействием
    this.neurons.forEach( (neuron,indexNeuron) => // Перебор всех нейронов
      {
        this.s=0;  // Инициализация переменной для суммирования
        y.forEach( (input, indexInput) =>  // Перебор данных входного воздействия
          {
            this.s+=(input - neuron.w[indexInput])**2; // Суммирование разности квадратов
          }        
        )
        this.D.push(Math.sqrt( this.s ));  // Добавление расстояния в список
      }
    )
    return this.indexMinimum(this.D); // Возвращение индекса победившего нейрона
  }
  coincidences()
  {
    /*
      Метод для определения совпадиния нейронов в которые попадают разные изображения
    */
    this.images={}                                // Очищаем массив
    this.classes.forEach( (value,indexValue) => { // Пробегаемся по всем изображениям
        if (this.images[value]==undefined) {      // Если ключа под номером такого нейрона  еще нет
          this.images[value]=[]                   // Тогда создаем его и инициализируем там список
        }
        this.images[value].push(indexValue)       // Добавляем номер изображения в победивший по нему нейрон
      } 
    )
    this.render()                                 // Отображаем изображения
  }
  render()
  {
    /*
      Процедура прорисовки таблицы отражающая результат классификации изображений.
    */
    document.querySelector(".table").innerHTML="<table></table>"; // Очищаем таблицу
    let th = "";                                                  // Переменная ячеек заголовка таблицы
    Object.keys(this.images).forEach( indexNeuron => {            // Пробегаемся по всем победившим нейронам
      let winner = this.neurons[indexNeuron],                     // Получаем победивший нейрон по индексу
      colorWinner = "rgb("+winner.avgR*255+","+winner.avgG*255+","+winner.avgB*255+")";//Берем его цвет на холсте
      th+="<th style='background:"+colorWinner+"'> Нейрон №"+indexNeuron+"</th>"  // Наполнение ячеек заголовка таблицы
      }
    ) 
    let first_tr = "<thead><tr>"+th+"</tr></thead><tbody>"        // Формирование заголовка таблицы
    document.querySelector(".table table").innerHTML+=first_tr    // Прикрепление заголавной части таблицы 
    let tr="",                                                    // Инициализируем переменную строки таблицы    
    td="",                                                        // Инициализируем переменную ячейки таблицы
    i=0;                                                          // Инициализация индекса изображений в победившем нейроне
    Ts.forEach( (value,indexImage) => 
      {
        tr += "<tr>";                               // Создаем новую строку  
        td="";                                      // Очищаем ячейку
        Object.keys(this.images).forEach( (key,indexClass) => {  // Пробегаемся по всем классам
            if(this.images[key][i]!=undefined)                   // Проверяем наличие изображения в победившем нейроне с индексом i 
            {
              let src = images[this.images[key][i]].src;         // Берем адрес изображения
                // Формируем ячейку и наполняем её изображением
                td+="<td><img src='"+src+"' onclick='nn.search([Ts["+this.images[key][i]+"]])'></td>"; 
            }
            else
            {
                td+="<td></td>"; // Создаём пустую ячейку 
            }
          } 
        ) 
        tr+=td+"</tr>";          // Формируем строку
        i++
      }
    )
    document.querySelector(".table table").innerHTML+=tr             // Прикрепляем новую строку
    document.querySelector(".table table").innerHTML+="</tbody>"     //Закрываем тег основной части таблицы
  }
  defenitionClass(winner)
  {
    /*
      Метод добавления номера победившего нейрона по входному изображению
    */
    this.classes.push(winner) //Добавление номера победившего нейрона
  }
  search(y)
  {
    /*
      Метод определения нейронов победителей (ближайших к входным воздействиям)
      Аргументы:
      y     : тип данных (список) - входные воздействия
    */
    this.classes=[]                             //  Очищаем список победителей
    this.neurons.forEach(value=>{value.color="rgb(255,255,255)";value.render()}) //Очищаем цвета карты
    y.forEach( value => {                       //  Пробегаемся по всем входным воздействиям
        this.winner = this.neuronWinner(value); //  Определяем номер нейрона победителя
        this.neurons[this.winner].recolor()     //  Красим только нейроны победители
        this.defenitionClass(this.winner)       //  Добавляем номер победившего нейрона по текущему изображению
      }
    )        
    
  }
  learn(T=10,L0=0.33)
  {
    /*
      Метод обучения нейронов карты.
      Аргументы:
      T : тип данных (целочисленный) - количество итераций обучения
      L0 : тип данных (вещественный) - начальное значение коэффициента скорости обучения
    */
    this.lambda = T/Math.log(this.sigma0); //Вычисление лямбда
    Ts.forEach( (value,indexValue) =>  //Пробегаемся по всем примерам
      {
        let randomExample = value//Ts[parseInt(Math.random()*Ts.length-1)]
        this.currentWinner = this.neurons[this.neuronWinner(randomExample)] //Получаем нейрон победителя
        for(let t = 0; t < T; t++)     //Обучаем T раз на каждом примере
        {
          this.sigma = this.sigma0 * Math.exp(-(t/this.lambda)) //Вычисляем сигма
          this.L = L0 * Math.exp(-(t/this.lambda))              //Вычисляем коэффициент скорости обучения
          this.neighbors = this.neurons.filter( neuron =>  Math.sqrt( (neuron.x-this.currentWinner.x)**2+(neuron.y-this.currentWinner.y)**2  ) < this.sigma);//Формируем массив соседей победившего нейрона
          this.neighbors.forEach( (neuron, indexNeuron) =>  //Пробегаемся по всем соседям
            { 
              //Узнаем расстояние до каждого соседа
              this.r = Math.sqrt( (neuron.x-this.currentWinner.x)**2+(neuron.y-this.currentWinner.y)**2  )
              this.theta = Math.exp(-((this.r**2) / (2*(this.sigma**2))))  //Вычисление тета
              
              neuron.w.forEach( (weight,indexWeight) =>  //Пробегаемся по всем весовым коэффициентам соседа
                {
                  this.neighbors[indexNeuron].w[indexWeight] += this.theta * this.L * (value[indexWeight] - weight); //Корректируем весовые коэффициенты
                }                
              )
            }                             
          )
        }
      }
    ) 
    this.recolor()//Перерисовываем карту после обучения
  }
  action(n,l)
  {
    /*
        Метод выполняющий все необходимых операций для отображения результатов обучения
        Аргументы:
        n : тип данных (целочисленный) - количество итераций обучения
        l : тип данных (вещественный) - начальное значение коэффициента скорости обучения

    */
    this.learn(n,l);      //Запуск метода для обучения сети
    this.search(Ts);      //Определение победивших нейронов на входном воздействии
    this.coincidences();  //Запуск метода по выявлению совпавших изображений на одном нейроне
    this.recolor()        //Перерисовка карты
  }
}




window.onload = ()     => {
  pixels = images.map( (value,indexValue) => { //Пробегаемся по всей выборке изображений
      context.clearRect(0,0, canvas.width, canvas.height) //Каждый раз очищаем холст
      context.drawImage(value,0,0);            //Прорисовываем изображение на холсте
      let data = [];                           //Инициализируем вектор уветов изображения
      for(let x =0; x < canvas.width;x++)      //Пробегаемся по столбикам изображения
      {                                       
          for(let y =0; y < canvas.height;y++) //Пробегаемся по строкам изображения 
          {
              let rgb = context.getImageData(x,y,1, 1).data.slice(0,3) //Получаем красный синий и зеленый цвет пикселя
              rgb.forEach(colorValue=>data.push(colorValue)) //Наполняем массив значений цветов пикселя
          }
      }
      return data; //Возвращаем список значений цветов изображения
    }
   )
  cArr() //Вызываем функцию для инициализации входных воздействий
  nn = new SOM(196608) // Создаем экземпляр классе самоорганизующейся карты

} 

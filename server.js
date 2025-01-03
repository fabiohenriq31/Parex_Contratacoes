const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');


const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta'; 

app.use(cors());
app.use(bodyParser.json());


mongoose.connect(
  'mongodb+srv://comerciallojao031:41cciqexC9eRoO79@cluster0.b63hk.mongodb.net/contratacoes?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('Conectado ao MongoDB'))
.catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

function verificarAdmin(req, res, next) {
  if (req.user.username !== 'fabio.damasceno') {
    return res.status(403).json({ message: 'Acesso negado. Somente administradores podem realizar esta ação.' });
  }
  next();
}
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const FuncionarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  status: { type: String, required: true },
  dataLiberacao: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);
const Funcionario = mongoose.model('Funcionario', FuncionarioSchema);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar usuário.', error });
  }
});

app.post('/usuarios', verificarAdmin, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const novoUsuario = new Usuario({ username, password: hashedPassword });

    await novoUsuario.save();
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar usuário.', error });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.post('/funcionarios', async (req, res) => {
  const { nome, status, dataLiberacao } = req.body;

  try {
    const funcionario = new Funcionario({ nome, status, dataLiberacao });
    await funcionario.save();
    res.status(201).json({ message: 'Funcionário adicionado com sucesso!', funcionario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar funcionário.', error });
  }
});

app.get('/funcionarios', async (req, res) => {
  try {
    const funcionarios = await Funcionario.find();
    res.json(funcionarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar funcionários.', error });
  }
});
app.delete('/funcionarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Funcionario.findByIdAndDelete(id);
    res.status(200).json({ message: 'Funcionário deletado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar funcionário.', error });
  }
});

app.patch('/funcionarios/:id', async (req, res) => {
  const { id } = req.params;
  const { status, dataLiberacao } = req.body;

  if (!status || !dataLiberacao) {
    return res.status(400).json({ message: 'Status e data de liberação são obrigatórios.' });
  }

  try {
    const funcionario = await Funcionario.findByIdAndUpdate(
      id,
      { status, dataLiberacao },
      { new: true }
    );

    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }

    res.json({ message: 'Funcionário atualizado com sucesso!', funcionario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar funcionário.', error });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

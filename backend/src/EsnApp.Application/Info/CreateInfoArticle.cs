using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record CreateInfoArticleCommand(
    string Title,
    string Content) : IRequest<Result<InfoArticleDto>>;

public class CreateInfoArticleCommandValidator : AbstractValidator<CreateInfoArticleCommand>
{
    public CreateInfoArticleCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Content).NotEmpty();
    }
}

public class CreateInfoArticleCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<CreateInfoArticleCommand, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        CreateInfoArticleCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new InfoArticle
        {
            Title = request.Title,
            Content = request.Content,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(InfoArticleDto.FromEntity(created));
    }
}
